/* eslint-disable @typescript-eslint/no-unsafe-argument */
// gitbrew/src/app/api/github-webhook/route.ts
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { env } from "../../../env";
import { db } from "~/server/db";

const webhooks = new Webhooks({
  secret: env.GITHUB_WEBHOOK_SECRET,
});

webhooks.on("push", async ({ id, payload }) => {
  console.log(`Received push event: ${id}`);

  // Get the GitHub user ID who pushed the commits
  const githubUserId = payload.sender?.id?.toString();
  if (!githubUserId) {
    console.error("No GitHub user ID found in payload");
    return;
  }

  // Find the user account
  const account = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "github",
        providerAccountId: githubUserId,
      },
    },
    include: {
      user: true,
    },
  });

  if (!account) {
    console.log(`No matching account found for GitHub ID: ${githubUserId}`);
    return;
  }

  const userId = account.userId;
  const user = account.user;

  // Process all commits in the push
  for (const commit of payload.commits) {
    const commitId = commit.id;
    const commitDate = new Date(commit.timestamp);

    // Set to start of day to ensure we only compare dates not times
    const commitDateOnly = new Date(
      commitDate.getFullYear(),
      commitDate.getMonth(),
      commitDate.getDate(),
    );

    // Check if this commit already exists
    const existingCommit = await db.commit.findUnique({
      where: { commitId },
    });

    if (!existingCommit) {
      // Store the new commit
      await db.commit.create({
        data: {
          commitId,
          createdAt: commitDate,
          date: commitDateOnly,
          userId,
        },
      });

      // Update user's streak
      await updateUserStreak(userId, commitDateOnly);
    }
  }
});

async function updateUserStreak(userId: string, commitDate: Date) {
  // Get user with their current streak info
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  // Initialize new streak values
  let currentStreak = user.currentStreak;
  let longestStreak = user.longestStreak;
  let shouldUpdateStreak = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Set commit date to start of day for proper comparison
  commitDate.setHours(0, 0, 0, 0);

  // Case 1: This is a commit from today
  if (commitDate.getTime() === today.getTime()) {
    // If user already had a commit today, nothing changes with streak
    // Check if we already have a commit for today
    const todayCommit = await db.commit.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // tomorrow
        },
      },
    });

    // Only count as a new day if this is the first commit today
    if (!todayCommit) {
      if (user.lastCommitDate) {
        const lastCommitDate = new Date(user.lastCommitDate);
        lastCommitDate.setHours(0, 0, 0, 0);

        // If last commit was yesterday, continue the streak
        if (lastCommitDate.getTime() === yesterday.getTime()) {
          currentStreak += 1;
          shouldUpdateStreak = true;
        }
        // If last commit was today, streak doesn't change
        else if (lastCommitDate.getTime() === today.getTime()) {
          // Streak remains the same
        }
        // Otherwise, reset the streak to 1
        else {
          currentStreak = 1;
          shouldUpdateStreak = true;
        }
      } else {
        // First commit ever
        currentStreak = 1;
        shouldUpdateStreak = true;
      }
    }
  }
  // Case 2: This is a commit from a past date that affects the streak calculation
  else if (commitDate < today) {
    // Check if this commit fills a gap in the streak
    // This is more complex and would require analyzing the commit history
    // For simplicity, we're not handling backdated commits in this implementation
    console.log("Past commit received - not affecting current streak");
    return;
  }

  // Update longest streak if needed
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Update the user record if streak changed
  if (shouldUpdateStreak) {
    await db.user.update({
      where: { id: userId },
      data: {
        currentStreak,
        longestStreak,
        lastCommitDate: commitDate,
      },
    });

    console.log(
      `Updated streak for user ${userId}: Current streak = ${currentStreak}, Longest streak = ${longestStreak}`,
    );
  }
}

export async function POST(req: Request) {
  // Get the request body as text
  const payload = await req.text();

  // Get the signature from the headers
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  // Get the event name and delivery ID from the headers
  const event = req.headers.get("x-github-event") ?? "";
  const id = req.headers.get("x-github-delivery") ?? "";

  try {
    // Verify the signature and process the webhook
    await webhooks.verifyAndReceive({
      id,
      name: event,
      payload,
      signature,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }
}
