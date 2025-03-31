import { NextResponse, type NextRequest } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { env } from "../../../env";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    // Not logged in? Kick 'em out.
    return NextResponse.redirect(new URL("/", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (state !== session.state) {
    return NextResponse.redirect(
      new URL("/onboarding/2?error=terminal_auth_failed", request.url),
    );
  }

  if (!code) {
    // Handle error from TERMINAL or missing code
    console.error("No code received from TERMINAL");
    return NextResponse.redirect(
      new URL("/onboarding/2?error=terminal_auth_failed", request.url),
    );
  }

  try {
    // Exchange code for tokens - BACKEND request
    const tokenResponse = await fetch(`${env.TERMINAL_API_URL}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "https://git-brew.vercel.app/terminal-redirect",
        client_id: env.TERMINAL_CLIENT_ID,
        client_secret: env.TERMINAL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData: unknown = await tokenResponse.json();
      console.error("TERMINAL token exchange failed:", errorData);
      throw new Error(`TERMINAL API Error: ${tokenResponse.statusText}`);
    }

    const tokens: unknown = await tokenResponse.json();
    // Define a type for the expected token response
    interface TokenResponse {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }

    // Type assertion after receiving the tokens
    const { access_token, refresh_token, expires_in } = tokens as TokenResponse;

    // TODO: Securely store tokens in DB associated with session.user.id
    // e.g., await db.terminalAccount.create({ data: { userId: session.user.id, accessToken: encrypt(access_token), refreshToken: encrypt(refresh_token), expiresAt: ... } })
    // Need to add a TerminalAccount model to prisma schema

    // Update onboarding status
    await db.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 2 }, // Assuming 2 is the next step
    });

    // Redirect to dashboard or next step
    return NextResponse.redirect(new URL("/dashboard", request.url)); // Or wherever they go next
  } catch (error) {
    console.error("Error during TERMINAL OAuth callback:", error);
    // Redirect back to the onboarding step with an error message
    return NextResponse.redirect(
      new URL("/onboarding/2?error=token_exchange_failed", request.url),
    );
  }
}
