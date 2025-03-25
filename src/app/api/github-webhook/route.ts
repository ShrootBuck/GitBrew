import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "../../../env";
export async function POST(request: Request) {
  // Retrieve signature from headers
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 401 },
    );
  }

  // Retrieve webhook secret from env variables
  const secret = env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Read the raw body as text
  const bodyText = await request.text();

  // Compute the HMAC digest for verification
  const hmac = createHmac("sha256", secret);
  hmac.update(bodyText);
  const computedSignature = `sha256=${hmac.digest("hex")}`;

  // Use constant-time comparison to check the signature
  const sigBuffer = Buffer.from(signature);
  const computedBuffer = Buffer.from(computedSignature);
  if (
    sigBuffer.length !== computedBuffer.length ||
    !timingSafeEqual(sigBuffer, computedBuffer)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  interface Commit {
    id: string;
    message: string;
    author?: {
      username?: string;
      name?: string;
    };
  }

  interface GithubPayload {
    commits?: Commit[];
  }

  let payload: GithubPayload;
  try {
    payload = JSON.parse(bodyText);
  } catch (_) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // Retrieve the GitHub event type header
  const eventType = request.headers.get("x-github-event");

  if (
    eventType === "push" &&
    payload.commits &&
    Array.isArray(payload.commits)
  ) {
    // For each commit, log the GitHub user (from commit.author) and commit id.
    // Note: GitHub's commit objects may differ based on context.
    payload.commits.forEach((commit: Commit) => {
      // Assuming the commit object includes an 'author' with a 'username' property.
      // If not available, fallback to 'name'.
      const githubUser: string =
        commit.author?.username ?? commit.author?.name ?? "Unknown GitHub User";

      console.log(
        `GitHub ID: ${githubUser} | Commit: ${commit.id} | Message: ${commit.message}`,
      );
    });
  }

  return NextResponse.json({ success: true });
}
