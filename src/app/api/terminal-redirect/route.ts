import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { env } from "../../../env";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

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

  // --- 2. Exchange Code for Access Token ---
  const tokenUrl = `${env.TERMINAL_API_URL}/token`;

  // The redirect URI *must* exactly match the one you sent in the initial auth request
  // AND the one registered in your Terminal App settings.
  const redirectUri = new URL(
    "/api/terminal-redirect",
    request.nextUrl.origin,
  ).toString();

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Use Basic Authentication to send client_id and client_secret
        Authorization: `Basic ${Buffer.from(`${env.TERMINAL_CLIENT_ID}:${env.TERMINAL_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Failed to exchange Terminal code for token. Status: ${response.status}`,
        errorBody,
      );
      throw new Error(`Terminal token exchange failed: ${response.status}`);
    }

    const tokenData: TerminalTokenResponse =
      (await response.json()) as TerminalTokenResponse;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; // Store this too if you get one!

    // --- 3. Get Current User's ID (CRITICAL - Needs Your Implementation!) ---
    // This depends entirely on how you manage GitHub sessions.
    // Example using NextAuth.js:
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   console.error("User not logged in during Terminal OAuth callback.");
    //   throw new Error("User session not found.");
    // }
    // const userId = session.user.id;

    // Replace this placeholder with your actual user ID retrieval logic:
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
        // Optionally update onboarding status if this is part of onboarding
        // onboardingStatus: 2, // Uncomment if Terminal connection is a step in onboarding
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

// --- Placeholder - Replace with your actual user ID logic ---
// This needs to interact with your existing GitHub authentication session
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Example if using NextAuth.js session cookie:
  // const session = await getServerSession(authOptions); // You might need to pass req/res here depending on setup
  // return session?.user?.id ?? null;

  // Example if you have user ID stored in an encrypted session cookie:
  // const sessionCookie = request.cookies.get('your-session-cookie-name');
  // if (sessionCookie) {
  //   const decryptedSession = await decrypt(sessionCookie.value); // Your decryption logic
  //   return decryptedSession?.userId ?? null;
  // }

  console.warn(
    "getCurrentUserId function is a placeholder - Implement your user session logic!",
  );
  // Return a dummy ID for testing ONLY IF ABSOLUTELY NECESSARY, remove for real use
  // return "cl_dummy_user_id_replace_me";
  return null; // Return null in reality until implemented
}
