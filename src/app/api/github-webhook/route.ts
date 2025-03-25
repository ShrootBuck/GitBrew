/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { env } from "../../../env";

const webhooks = new Webhooks({
  secret: env.GITHUB_WEBHOOK_SECRET,
});

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

    // Check if this is a push event (new commits)
    if (event === "push") {
      // Parse the payload to access commit information
      const pushPayload = JSON.parse(payload);

      // Check if there are commits in the payload
      if (pushPayload.commits && pushPayload.commits.length > 0) {
        const username = pushPayload.sender?.login;
        const commitCount = pushPayload.commits.length;

        console.log(
          `Received ${commitCount} new commits from user: ${username}`,
        );
        // Process the commits as needed here
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }
}
