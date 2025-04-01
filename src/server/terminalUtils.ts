import { db } from "~/server/db";
import { env } from "~/env";

interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string; // Might get a new one
  expires_in: number;
  token_type: string;
  // scope?: string; // etc.
}

// Refreshes the token if needed and returns a valid access token
export async function getValidTerminalToken(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      terminalAccessToken: true,
      terminalRefreshToken: true,
      terminalExpiresAt: true,
    },
  });

  if (!user?.terminalAccessToken || !user.terminalRefreshToken) {
    throw new Error(`User ${userId} missing Terminal token information.`);
  }

  const now = new Date();
  const expiresAt = user.terminalExpiresAt
    ? new Date(user.terminalExpiresAt)
    : now;
  const bufferSeconds = 300; // Refresh if expiring within 5 minutes

  // Check if token is expired or close to expiring
  if (now.getTime() >= expiresAt.getTime() - bufferSeconds * 1000) {
    console.log(
      `Token for user ${userId} expired or expiring soon. Refreshing...`,
    );
    try {
      const response = await fetch(`${env.TERMINAL_AUTH_URL}/token`, {
        // Add TERMINAL_AUTH_URL to env!
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: user.terminalRefreshToken,
          client_id: env.TERMINAL_CLIENT_ID,
          client_secret: env.TERMINAL_SECRET,
        }),
      });

      if (!response.ok) {
        const errorData: unknown = await response.json();
        console.error("Terminal token refresh failed:", errorData);
        throw new Error(
          `Terminal token refresh failed: ${response.statusText}`,
        );
      }

      const tokens = (await response.json()) as RefreshTokenResponse;
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Update DB with new tokens
      await db.user.update({
        where: { id: userId },
        data: {
          terminalAccessToken: tokens.access_token,
          // Update refresh token only if a new one is provided
          terminalRefreshToken:
            tokens.refresh_token ?? user.terminalRefreshToken,
          terminalExpiresAt: newExpiresAt,
        },
      });

      console.log(`Token refreshed successfully for user ${userId}.`);
      return tokens.access_token; // Return the new access token
    } catch (error) {
      console.error(`Error refreshing token for user ${userId}:`, error);
      // If refresh fails, we can't proceed. Maybe clear tokens? Or just error out.
      // Clearing might be bad if it was a temporary network issue.
      // For now, just re-throw the error. The calling function must handle it.
      throw new Error(`Failed to refresh Terminal token for user ${userId}.`);
    }
  }

  // Token is still valid, return the existing one
  return user.terminalAccessToken;
}
