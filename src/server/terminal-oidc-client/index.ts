// lib/terminal-oidc-client.ts (or wherever you like)
import { Issuer, BaseClient, custom } from "openid-client";
import { env } from "../../env"; // Your validated env import

let terminalClient: BaseClient | null = null;

export async function getTerminalClient(): Promise<BaseClient> {
  if (terminalClient) {
    return terminalClient;
  }

  // Configure request options if needed (e.g., timeouts)
  // custom.setHttpOptionsDefaults({ timeout: 5000 });

  // Option 1: Use Issuer discovery (if Terminal provides a .well-known/openid-configuration)
  // const issuer = await Issuer.discover(env.TERMINAL_ISSUER);
  // console.log('Discovered issuer %s %O', issuer.issuer, issuer.metadata);
  // terminalClient = new issuer.Client({
  //   client_id: env.TERMINAL_CLIENT_ID,
  //   client_secret: env.TERMINAL_SECRET,
  //   redirect_uris: [`${env.APP_BASE_URL}/api/terminal/callback`],
  //   response_types: ['code'], // Must include 'code'
  //   // id_token_signed_response_alg (optional, defaults to RS256)
  // });

  // Option 2: Manual configuration (simpler if discovery isn't needed/working)
  const issuer = new Issuer({
    issuer: env.TERMINAL_ISSUER, // Still good practice to define issuer ID
    authorization_endpoint: env.TERMINAL_AUTHORIZATION_ENDPOINT,
    token_endpoint: env.TERMINAL_TOKEN_ENDPOINT,
    // jwks_uri: `${env.TERMINAL_ISSUER}/.well-known/jwks.json` // Needed if validating ID tokens (prob not here)
  });

  terminalClient = new issuer.Client({
    client_id: env.TERMINAL_CLIENT_ID,
    client_secret: env.TERMINAL_SECRET,
    redirect_uris: [`${env.APP_BASE_URL}/api/terminal/callback`], // Must match exactly!
    response_types: ["code"], // Important!
  });

  return terminalClient;
}
