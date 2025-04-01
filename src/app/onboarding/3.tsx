import { FaCreditCard } from "react-icons/fa";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getValidTerminalToken } from "~/server/terminalUtils";
import Terminal from "@terminaldotshop/sdk";
import { env } from "~/env";
import Link from "next/link";

export default async function LinkCreditCard() {
  const session = await auth();

  if (!session) {
    return;
  }

  async function updateOnboardingStatus() {
    "use server";

    if (!session?.user?.id) return;

    await db.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: 3 },
    });
  }

  if (!session?.user?.id) return;

  const accessToken = await getValidTerminalToken(session.user.id);

  const terminal = new Terminal({
    bearerToken: accessToken,
    baseURL: env.TERMINAL_API_URL,
  });

  const card = await terminal.card.collect();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Link Credit Card
        </h2>

        <div className="max-w-2xl text-center text-xl">
          <p className="mb-4">
            To continue, please link your credit card to complete your account
            setup.
          </p>
          <p>This is required to process your coffee orders.</p>
        </div>

        <div className="link-card-button-container">
          <Link
            target="_blank"
            href={card.data.url}
            className="flex items-center gap-3 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:bg-[#8a69b8]"
          >
            <FaCreditCard className="text-2xl" /> Link Credit Card
          </Link>
        </div>

        <form action={updateOnboardingStatus}>
          <button
            type="submit"
            className="mt-6 cursor-pointer rounded-full bg-green-600 px-8 py-3 text-lg font-semibold transition-all hover:bg-green-700"
          >
            Done
          </button>
        </form>

        <p className="mt-4 text-center text-lg text-white/70">
          Your payment information will be securely stored to process your
          coffee orders.
        </p>
      </div>
    </div>
  );
}
