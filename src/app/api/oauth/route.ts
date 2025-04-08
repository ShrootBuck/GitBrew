import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { env } from "~/env";

export async function GET() {
  //  Generate a random state string for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  (await cookies()).set("terminal_oauth_state", state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  // Construct Terminal's Authorization URL
  const authorizationUrl = new URL(`${env.TERMINAL_AUTH_URL}/authorize`);

  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", env.TERMINAL_CLIENT_ID);
  authorizationUrl.searchParams.set(
    "redirect_uri",
    "https://git-brew.vercel.app/api/terminal-redirect",
  );
  authorizationUrl.searchParams.set("state", state); // Pass the generated state
  const scopes = [
    "primeagen's basement",
    "theo's garden",
    "tanner's workshop",
    "olivia's library",
    "jack's kitchen",
  ];
  const randomScope = scopes[Math.floor(Math.random() * scopes.length)];
  authorizationUrl.searchParams.set(
    "scope",
    randomScope ?? "teej's neovim config",
  ); // For fun

  return NextResponse.redirect(authorizationUrl.toString());
}
