// src/app/api/terminal-redirect/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers"; // Import cookies
import { db } from "~/server/db";
import { env } from "../../../env";
import { auth } from "~/server/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateFromUrl = url.searchParams.get("state");

  const cookers = await cookies();

  const stateFromCookie = cookers.get("terminal_oauth_state")?.value; // Get state from cookie

  // Clear the cookie immediately after reading it, regardless of success/failure
  cookers.delete("terminal_oauth_state");

  // Check if state exists from both sources and if they match
  if (!stateFromUrl || !stateFromCookie || stateFromUrl !== stateFromCookie) {
    console.error(
      "OAuth State mismatch:",
      { stateFromUrl, stateFromCookie },
      "Redirecting with error.",
    );
    // Redirect back to onboarding step 2 with error
    return NextResponse.redirect(
      new URL("/onboarding/2?error=state_mismatch", request.url), // Use specific error
    );
  }

  if (!code) {
    console.error("No code received from TERMINAL");
    return NextResponse.redirect(
      new URL("/onboarding/2?error=terminal_auth_failed", request.url),
    );
  }

  // Exchange code for tokens (your existing logic) - Make sure redirect_uri here matches the one above!
  try {
    const tokenResponse = await fetch(`https://auth.dev.terminal.shop/token`, {
      // Use /token endpoint from metadata
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "https://git-brew.vercel.app/api/terminal-redirect", // MUST MATCH EXACTLY
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
    interface TokenResponse {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      // Add other fields if needed (id_token, token_type, scope)
    }
    const { access_token, refresh_token, expires_in } = tokens as TokenResponse;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        terminalAccessToken: access_token,
        terminalRefreshToken: refresh_token,
        terminalExpiresAt: expiresAt,
        onboardingStatus: 2, // Update status
      },
    });
    // --- End DB update ---

    // Redirect to the main app page (or wherever they go after onboarding)
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Error during TERMINAL OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/onboarding/2?error=token_exchange_failed", request.url),
    );
  }
}
