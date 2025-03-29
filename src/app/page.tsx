import { auth } from "~/server/auth";
import Landing from "./onboarding/0";
import GithubApp from "./onboarding/1";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    return <GithubApp />;
  }
  return <Landing />;
}
