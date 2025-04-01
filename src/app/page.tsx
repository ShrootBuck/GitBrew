import { auth } from "~/server/auth";
import Landing from "./onboarding/0";
import GithubApp from "./onboarding/1";
import { db } from "~/server/db";
import TerminalConnect from "./onboarding/2";

import LinkCreditCard from "./onboarding/3";
import AddressForm from "./onboarding/4";
import { redirect } from "next/navigation";

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
        return <LinkCreditCard />;
      case 3:
        return <AddressForm />;
      case 4:
        return redirect("/dashboard");
    }
  }

  return <Landing />;
}
