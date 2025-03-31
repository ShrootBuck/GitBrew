import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { env } from "../../../env";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import OAuth2Server from "@node-oauth/oauth2-server";

// Define the structure of the token response from Terminal
interface TerminalTokenResponse {
  access_token: string;
  token_type: string; // Usually "Bearer"
  expires_in?: number; // Optional: time in seconds until expiry
  refresh_token?: string; // Optional: If Terminal provides refresh tokens
  scope?: string; // Optional: Scopes granted
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const storedState = cookieStore.get("terminal_oauth_state")?.value;

  // --- 1. Security Check: Verify State ---
  if (!state || !storedState || state !== storedState) {
    console.error("OAuth State mismatch or missing.");
    // Redirect to an error page or your settings page with an error flag
    const redirectUrl = new URL("/settings", request.nextUrl.origin); // Or wherever you want to send them
    redirectUrl.searchParams.set("terminal_error", "state_mismatch");
    return NextResponse.redirect(redirectUrl);
  }

  // --- Cleanup: Delete the state cookie (it's single-use) ---
  cookieStore.delete("terminal_oauth_state");

  if (!code) {
    console.error("Missing authorization code from Terminal.");
    const redirectUrl = new URL("/settings", request.nextUrl.origin);
    redirectUrl.searchParams.set("terminal_error", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  // The redirect URI *must* exactly match the one you sent in the initial auth request
  // AND the one registered in your Terminal App settings.
  const redirectUri = new URL(
    "/api/terminal-redirect",
    request.nextUrl.origin,
  ).toString();

  try {
    // --- 2. Exchange code for token using fetch instead of axios ---
    const tokenUrl = `${env.TERMINAL_API_URL}/token`;
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("client_id", env.TERMINAL_CLIENT_ID);
    params.append("client_secret", env.TERMINAL_SECRET);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Token request failed with status: ${response.status}`);
    }

    const tokenData = (await response.json()) as TerminalTokenResponse;

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // --- 3. Get Current User's ID ---
    const session = await auth();
    const userId = session?.user.id;
    if (!userId) {
      console.error(
        "Could not retrieve user ID during Terminal OAuth callback.",
      );
      throw new Error("User ID retrieval failed.");
    }

    // --- 4. Store the Token Securely ---
    await db.user.update({
      where: { id: userId },
      data: {
        terminalToken: accessToken,
        // Store refresh token if available
        ...(refreshToken ? { terminalRefreshToken: refreshToken } : {}),
        // Store token expiration if available
        ...(tokenData.expires_in
          ? {
              terminalTokenExpiresAt: new Date(
                Date.now() + tokenData.expires_in * 1000,
              ),
            }
          : {}),
        onboardingStatus: 2,
      },
    });

    console.log(`Successfully linked Terminal account for user ${userId}`);

    // --- 5. Redirect User on Success ---
    const successRedirectUrl = new URL("/settings", request.nextUrl.origin); // Back to settings or dashboard
    successRedirectUrl.searchParams.set("terminal_linked", "true");
    return NextResponse.redirect(successRedirectUrl);
  } catch (error) {
    console.error("Error in Terminal OAuth callback:", error);
    const errorRedirectUrl = new URL("/settings", request.nextUrl.origin);
    errorRedirectUrl.searchParams.set("terminal_error", "callback_failed");
    return NextResponse.redirect(errorRedirectUrl);
  }
}
