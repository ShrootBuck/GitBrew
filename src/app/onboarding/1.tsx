import { FaGithub } from "react-icons/fa";
import Link from "next/link";

export default function GithubApp() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Connect your GitHub Repositories
        </h2>

        <div className="max-w-2xl text-center text-xl">
          <p className="mb-4">
            To continue, please add our GitHub App to your repositories.
          </p>
          <p>
            This will allow us to track your commits and build your coffee
            streak.
          </p>
        </div>

        <div className="github-app-button-container">
          <Link
            href="https://github.com/apps/gitbrew-code-watcher/installations/new"
            className="flex items-center gap-3 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:bg-[#8a69b8]"
          >
            <FaGithub className="text-2xl" /> Add GitHub App
          </Link>
        </div>

        <p className="mt-4 text-center text-lg text-white/70">
          You can select which repositories to give access to during the
          installation process.
        </p>
      </div>
    </div>
  );
}
