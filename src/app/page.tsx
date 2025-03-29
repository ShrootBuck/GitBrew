import { auth } from "~/server/auth";
import Landing from "./onboarding/landing";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    return <p>hello</p>;
  }
  return <Landing />;
}
