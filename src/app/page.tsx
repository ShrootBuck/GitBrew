import { auth } from "~/server/auth";
import Landing from "./onboarding/0";
import GithubApp from "./onboarding/1";
import { db } from "~/server/db";
import TerminalConnect from "./onboarding/2";
import { redirect } from "next/navigation";
import Terminal from "@terminaldotshop/sdk";
import { getValidTerminalToken } from "~/server/terminalUtils";
import { env } from "~/env";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    // Get the user
    const user = await db.user.findUnique({ where: { id: session.user.id } });

    switch (user?.onboardingStatus) {
      case 0:
        return <GithubApp />;
      case 1:
        return <TerminalConnect />;
      case 2:
        const accessToken = await getValidTerminalToken(user.id);

        const terminal = new Terminal({
          bearerToken: accessToken,
          baseURL: env.TERMINAL_API_URL,
        });
        const card = await terminal.card.collect();
        return redirect(card.data.url);
    }
  }
  return <Landing />;
}
