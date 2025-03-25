
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export async function POST(request: Request) {
  // Get the GitHub signature from request headers
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 401 },
    );
  }

  // Retrieve your webhook secret from environment variables
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Read the raw body as a text so we can compute the hash
  const body = await request.text();

  // Compute the HMAC digest to compare with the incoming signature
  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const digest = `sha256=${hmac.digest("hex")}`;

  // Compare the computed digest with the signature using a constant-time comparison
  const sigBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);
  if (
    sigBuffer.length !== digestBuffer.length ||
    !timingSafeEqual(sigBuffer, digestBuffer)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the JSON payload
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // Determine the event type from headers; process push events in this example
  const eventType = request.headers.get("x-github-event");
  if (eventType === "push") {
    const commits =
      typeof payload === "object" &&
      payload !== null &&
      "commits" in payload &&
      Array.isArray((payload as any).commits)
        ? (payload as { commits: any[] }).commits
        : [];
    console.log(`Received push event with ${commits.length} commits.`);
    commits.forEach((commit: any) => {
      console.log(`Commit: ${commit.id}`);
      console.log(`Message: ${commit.message}`);
      console.log(`Author: ${commit.author.username}`);
      // Add your custom commit tracking logic here
    });
  }

  // Respond quickly to GitHub
  return NextResponse.json({ success: true });
}
```
