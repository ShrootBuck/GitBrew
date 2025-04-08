import { FaCreditCard } from "react-icons/fa";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getValidTerminalToken } from "~/server/terminalUtils";
import Terminal from "@terminaldotshop/sdk";
import { env } from "~/env";
import type { Prisma } from "@prisma/client";

async function saveCardAndProceed() {
  "use server"; // Still need this bs

  const session = await auth();
  if (!session) {
    // Should be protected by page auth check, but good practice
    console.error("saveCardAndProceed called without authenticated user.");
    redirect("/api/auth/signin");
  }
  const userId = session.user.id;

  let defaultCardIdToSet: string | null = null;

  try {
    // Get valid token
    const accessToken = await getValidTerminalToken(userId);
    const terminal = new Terminal({
      bearerToken: accessToken,
      baseURL: env.TERMINAL_API_URL,
    });

    // Fetch the user's cards from Terminal
    const cardsResponse = await terminal.card.list();
    const cards = cardsResponse.data ?? [];

    // Check if any cards exist
    if (cards.length > 0) {
      // Set the *first* card in the list as the default
      defaultCardIdToSet = cards[0]?.id ?? null;
      console.log(
        `User ${userId} has cards. Setting first card ${defaultCardIdToSet} as default.`,
      );
    } else {
      // No cards found - maybe they didn't add one?
      // We'll still let them proceed for now, but won't set a default.
      // They can set it later in settings.
      console.log(
        `User ${userId} clicked done on step 3, but no cards found via Terminal API. Proceeding without setting default card.`,
      );
    }

    // Prepare update data - always update status, conditionally update card id
    const updateData: Prisma.UserUpdateInput = {
      onboardingStatus: 3, // Advance to next step (address)
    };
    if (defaultCardIdToSet) {
      updateData.defaultCardId = defaultCardIdToSet;
    }

    // Update the user in the database
    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    console.log(
      `User ${userId} onboarding status updated to 3. Default card ${defaultCardIdToSet ? `set to ${defaultCardIdToSet}` : "not set"}.`,
    );
  } catch (error) {
    console.error(
      `Failed during onboarding step 3 completion for user ${userId}:`,
      error,
    );
  }

  redirect("/loading"); // The loading page will route based on the new onboardingStatus
}

export default async function LinkCreditCard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }
  const userId = session.user.id;

  // Fetch the Terminal URL server-side before rendering
  let cardUrl: string | null = null;
  let fetchError: string | null = null;
  try {
    const accessToken = await getValidTerminalToken(userId);
    const terminal = new Terminal({
      bearerToken: accessToken,
      baseURL: env.TERMINAL_API_URL,
    });
    const card = await terminal.card.collect();
    cardUrl = card.data.url;
  } catch (error) {
    console.error("Failed to get Terminal card collection URL:", error);
    fetchError =
      "Error fetching the link to add your card. Please refresh the page or try again later.";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <FaCreditCard className="mb-2 text-5xl text-green-400" />
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Link Your Card
        </h2>

        <div className="max-w-2xl text-center text-xl">
          <p className="mb-4">
            Almost there! Click below to securely add your payment card via
            Terminal. This is needed for coffee shipping costs.
          </p>
          <p className="text-white/70">
            Once you&apos;ve added your card on Terminal&apos;s page, come back
            here and click the &quot;I&apos;ve Added My Card&quot; button below.
          </p>
          {fetchError && <p className="mt-4 text-red-400">{fetchError}</p>}
        </div>

        <div className="link-card-button-container">
          {cardUrl ? (
            <Link
              href={cardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:bg-[#8a69b8]"
            >
              <FaCreditCard className="text-2xl" /> Add Card via Terminal
            </Link>
          ) : (
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-3 rounded-full bg-gray-600 px-8 py-4 text-xl font-bold opacity-50"
            >
              <FaCreditCard className="text-2xl" /> Add Card via Terminal
            </button>
          )}
        </div>

        {/* Form now calls the updated server action */}
        <form action={saveCardAndProceed}>
          <button
            type="submit"
            disabled={!cardUrl || !!fetchError} // Disable if URL failed or couldn't be fetched
            className={`mt-6 rounded-full px-8 py-3 text-lg font-semibold transition-all ${
              !cardUrl || !!fetchError
                ? "cursor-not-allowed bg-gray-600 opacity-50"
                : "bg-green-600 hover:cursor-pointer hover:bg-green-700"
            }`}
          >
            I&apos;ve Added My Card
          </button>
        </form>

        <p className="mt-4 text-center text-lg text-white/70">
          Terminal handles payment info securely. We don&apos;t see your full
          card details.
        </p>
      </div>
    </div>
  );
}
