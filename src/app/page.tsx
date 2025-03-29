import { auth } from "~/server/auth";
import Landing from "./onboarding/0";
import GithubApp from "./onboarding/1";
import { db } from "~/server/db";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    // Get the user
    const user = await db.user.findUnique({ where: { id: session.user.id } });

    switch (user.onboardingStatus) {
      case 1:
        return <p>Hi!</p>;
      case "ACTIVE":
        return <GithubApp />;
      case "INACTIVE":
        return <Landing />;
    }
  }
  return <Landing />;
}
