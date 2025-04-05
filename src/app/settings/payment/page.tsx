// src/app/settings/payment/page.tsx
import { FaCreditCard, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"; // For updating the page after save

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getValidTerminalToken } from "~/server/terminalUtils";
import Terminal from "@terminaldotshop/sdk";
import { env } from "~/env";

// --- Server Action to Save Default Card ---
async function saveDefaultCard(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated"); // Should be caught by page auth anyway
  }
  const userId = session.user.id;
  const selectedCardId = formData.get("selectedCardId") as string;

  if (!selectedCardId) {
    console.error(`User ${userId} submitted without selecting a card.`);
    // Maybe redirect with an error? For now, just log and do nothing.
    // You could also add client-side validation.
    return; // Or throw an error to show feedback
  }

  try {
    // Optional: Verify the card ID actually belongs to the user via Terminal API?
    // Could fetch cards again here, but might be overkill if the form is trusted.

    await db.user.update({
      where: { id: userId },
      data: { defaultCardId: selectedCardId },
    });

    console.log(
      `User ${userId} successfully set default card to ${selectedCardId}`,
    );

    // Revalidate the path to show the updated selection immediately
    revalidatePath("/settings/payment");
    // Optionally redirect or just let the page reload with new state
    // redirect("/settings/payment?success=true"); // Example redirect with flag
  } catch (error) {
    console.error(
      `Failed to save default card ${selectedCardId} for user ${userId}:`,
      error,
    );
    // Throw error or redirect with failure flag
    throw new Error("Failed to save default card.");
  }
}
// --- End Server Action ---

// --- Page Component ---
export default async function SettingsPaymentPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }
  const userId = session.user.id;

  let cards: Terminal.Card[] = [];
  let cardCollectUrl: string | null = null;
  let currentDefaultCardId: string | null = null;
  let fetchError: string | null = null;

  try {
    // Fetch user's current default card from DB
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { defaultCardId: true },
    });
    currentDefaultCardId = user?.defaultCardId ?? null;

    // Get valid Terminal token
    const accessToken = await getValidTerminalToken(userId);
    const terminal = new Terminal({
      bearerToken: accessToken,
      baseURL: env.TERMINAL_API_URL,
    });

    // Fetch card list AND card collection URL in parallel
    const [cardsResponse, cardCollectResponse] = await Promise.all([
      terminal.card.list(),
      terminal.card.collect(),
    ]);

    cards = cardsResponse.data ?? [];
    cardCollectUrl = cardCollectResponse.data.url;
  } catch (error) {
    console.error(
      `Failed to fetch Terminal data for user ${userId}:`,
      error instanceof Error ? error.message : error,
    );
    fetchError =
      "Could not load your payment methods or the update link. Please try again later.";
    // Don't wipe cards or URL if already fetched, might be partial failure
    if (!cards) cards = [];
    cardCollectUrl ??= null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex max-w-lg flex-col items-center justify-center gap-6 rounded-xl border border-white/10 bg-white/5 px-8 py-12 shadow-lg">
        <FaCreditCard className="mb-2 text-5xl text-green-400" />

        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Manage Payment Method
        </h2>

        {fetchError && <p className="text-center text-red-400">{fetchError}</p>}

        {!fetchError && cards.length === 0 && (
          <p className="text-center text-lg text-white/80">
            You haven&apos;t added any payment methods yet.
          </p>
        )}

        {!fetchError && cards.length > 0 && (
          <>
            <p className="text-center text-lg text-white/80">
              Select the card you want to use for coffee shipping costs:
            </p>
            {/* Form to handle card selection */}
            <form action={saveDefaultCard} className="w-full space-y-3">
              {cards.map((card) => (
                <label
                  key={card.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all ${
                    currentDefaultCardId === card.id
                      ? "border-green-500 bg-green-900/30"
                      : "border-gray-600 bg-gray-800/50 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Basic Icon logic - add more specific icons if needed */}
                    <FaCreditCard className="h-6 w-6 text-gray-300" />
                    <span className="font-medium">
                      {card.brand?.toUpperCase() ?? "Card"} ending in{" "}
                      {card.last4}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {currentDefaultCardId === card.id && (
                      <FaCheckCircle className="mr-3 text-green-400" />
                    )}
                    <input
                      type="radio"
                      name="selectedCardId"
                      value={card.id}
                      defaultChecked={currentDefaultCardId === card.id}
                      className="h-4 w-4 cursor-pointer text-purple-600 focus:ring-purple-500"
                      required // Make sure one is selected
                    />
                  </div>
                </label>
              ))}
              <button
                type="submit"
                className="w-full rounded-full bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-all hover:cursor-pointer hover:bg-green-700 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
              >
                Save Default Card
              </button>
            </form>
          </>
        )}

        {/* Link to add/update cards via Terminal */}
        {cardCollectUrl && (
          <div className="mt-6 w-full border-t border-white/10 pt-6">
            <p className="mb-3 text-center text-white/70">
              Need to add a new card or update details?
            </p>
            <Link
              href={cardCollectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full border border-purple-500/50 bg-transparent px-8 py-3 text-center text-lg font-semibold text-purple-300 transition-all hover:border-purple-400 hover:bg-purple-900/20"
            >
              Add Card via Terminal
            </Link>
          </div>
        )}

        <Link
          href="/home"
          className="mt-4 inline-block text-sm text-white/60 hover:text-white"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
