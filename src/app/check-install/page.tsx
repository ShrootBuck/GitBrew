// /app/check-install/page.tsx (or Route Handler if API route)

import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { env } from "../../env";

export default async function CheckInstallPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const token = await getToken({
    req: { headers: headers(), cookies: cookies() } as never,
    secret: env.AUTH_SECRET,
  });
  const githubAccessToken = token?.access_token as string;

  // 🔍 1. Call GitHub API to see if user has your app installed
  const res = await fetch("https://api.github.com/user/installations", {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  interface Installation {
    app_id: number;
    id: number;
  }

  interface InstallationsResponse {
    installations: Installation[];
  }

  const data = (await res.json()) as InstallationsResponse;
  const appId = parseInt(env.AUTH_GITHUB_ID); // your app's numeric ID

  const hasInstalled = data?.installations?.some(
    (install: Installation) => install.app_id === appId,
  );

  if (hasInstalled) {
    redirect("/"); // or wherever
  } else {
    // 👇 Send them to install page
    redirect("https://github.com/apps/gitbrew-code-watcher/installations/new");
  }
}
