import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { env } from "~/env";

export async function GET() {
  // 1. Generate a random state string for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // 2. Store the state in a short-lived, httpOnly cookie
  //    'httpOnly' prevents client-side JS access.
  //    'secure' ensures it's only sent over HTTPS (MUST use in production).
  //    'path=/' makes it available across the site (needed for the callback).
  //    'maxAge' sets expiry in seconds (e.g., 10 minutes).
  (
    await // 2. Store the state in a short-lived, httpOnly cookie
    //    'httpOnly' prevents client-side JS access.
    //    'secure' ensures it's only sent over HTTPS (MUST use in production).
    //    'path=/' makes it available across the site (needed for the callback).
    //    'maxAge' sets expiry in seconds (e.g., 10 minutes).
    cookies()
  ).set("terminal_oauth_state", state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production", // Only secure in prod
    path: "/",
    maxAge: 600, // 10 minutes
  });

  // 3. Construct Terminal's Authorization URL
  const authorizationUrl = new URL(
    // Endpoint from the metadata you provided
    `${env.TERMINAL_AUTH_URL}/authorize`,
  );

  authorizationUrl.searchParams.set("response_type", "code"); // Standard OAuth code flow
  authorizationUrl.searchParams.set("client_id", env.TERMINAL_CLIENT_ID);
  authorizationUrl.searchParams.set(
    "redirect_uri",
    // IMPORTANT: This MUST exactly match the redirect URI registered with Terminal
    // AND the one used in your /api/terminal-redirect token exchange.
    "https://git-brew.vercel.app/api/terminal-redirect", // Changed to likely actual callback URL
  );
  authorizationUrl.searchParams.set("state", state); // Pass the generated state
  // authorizationUrl.searchParams.set("scope", "requested_scopes"); // Add if Terminal requires specific scopes

  // 4. Redirect the user
  return NextResponse.redirect(authorizationUrl.toString());
}
