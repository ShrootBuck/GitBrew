import Link from "next/link";
import { FaGithub, FaCoffee, FaFire, FaTrophy } from "react-icons/fa";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-center text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Git<span className="text-[#6e5494]">Brew</span>
        </h1>
        <p className="max-w-2xl text-center text-xl">
          Commit to GitHub consistently for two weeks straight, and we&apos;ll
          reward you with a 12oz coffee of your choice. Build your streak, fuel
          your code.
        </p>

        <div className="my-6 flex flex-wrap justify-center gap-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/10"
            >
              <FaGithub
                className={`${i < 5 ? "text-green-400" : "text-white/30"}`}
              />
            </div>
          ))}
        </div>

        <Link
          href="/api/auth/signin"
          className="flex items-center gap-3 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:bg-[#8a69b8]"
        >
          <FaGithub className="text-2xl" /> Get Started
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
          <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 text-white transition-all hover:bg-white/20">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <FaGithub className="text-3xl" />
            </div>
            <h3 className="text-2xl font-bold">Connect GitHub</h3>
            <div className="text-lg">
              Link your GitHub account and we&apos;ll automatically track your
              commits across repositories.
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 text-white transition-all hover:bg-white/20">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <FaFire className="text-3xl text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold">Build Your Streak</h3>
            <div className="text-lg">
              Commit code for 14 consecutive days to qualify. We&apos;ll keep
              track and notify you of your progress.
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-6 text-white transition-all hover:bg-white/20">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <FaCoffee className="text-3xl text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold">Earn Your Coffee</h3>
            <div className="text-lg">
              Complete the challenge and we&apos;ll send a fresh 12oz coffee
              directly to your doorstep.
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-md rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-4">
            <FaTrophy className="text-3xl text-yellow-400" />
            <h3 className="text-2xl font-bold">Leaderboard Highlights</h3>
          </div>
          <div className="space-y-3">
            {["codemaster99", "devguru42", "coffeeandcode"].map((name, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded bg-white/5 p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white/70">{i + 1}.</span>
                  <span>{name}</span>
                </div>
                <span className="font-semibold text-green-400">
                  {32 - i * 5} day streak
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
