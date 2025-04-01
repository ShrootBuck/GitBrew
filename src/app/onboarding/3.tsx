// /src/app/onboarding/3.tsx
import { FaCreditCard } from "react-icons/fa";
import Link from "next/link";
import { redirect } from "next/navigation"; // Import redirect

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getValidTerminalToken } from "~/server/terminalUtils";
import Terminal from "@terminaldotshop/sdk";
import { env } from "~/env";

export default async function LinkCreditCard() {
  const session = await auth();

  // Basic auth check
  if (!session?.user?.id) {
    // Redirect to login or show an error if no session
    redirect("/api/auth/signin"); // Or wherever you want to send unauth users
    return; // Stop execution
  }

  const userId = session.user.id;

  // Server action defined right here
  async function updateOnboardingStatus() {
    "use server";

    if (!userId) return; // Redundant check, but safe

    try {
      await db.user.update({
        where: { id: userId },
        data: { onboardingStatus: 3 }, // Just update the status, no questions asked
      });
      console.log(`User ${userId} clicked 'Done' on step 3. Trusting them.`);
      redirect("/"); // Send 'em to the main page
    } catch (error) {
      console.error(
        `Failed to update onboarding status for user ${userId} after they clicked 'Done'`,
        error,
      );
      // Maybe redirect with a generic error? Or just let them stay here?
      // For simplicity, let's just log and maybe they retry clicking 'Done'.
      // redirect('/onboarding/3?error=update_failed'); // Optional: redirect back with error
    }
  }

  // Fetch the Terminal URL server-side before rendering
  let cardUrl: string | null = null;
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
    // If this fails, the user can't even click the link... might want to show an error message.
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Link Credit Card
        </h2>

        <div className="max-w-2xl text-center text-xl">
          <p className="mb-4">
            Last step: Link your card via Terminal for shipping costs. Hit the
            button, add your card there, come back, and click &apos;Done&apos;
            below.
          </p>
          {/* <p>This is required to process your coffee orders.</p> */}
          {!cardUrl && (
            <p className="text-red-400">
              Error fetching the card link. Try refreshing maybe?
            </p>
          )}
        </div>

        <div className="link-card-button-container">
          {cardUrl ? (
            <Link
              href={cardUrl}
              target="_blank" // Still good UX
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:bg-[#8a69b8]"
            >
              <FaCreditCard className="text-2xl" /> Link Credit Card via
              Terminal
            </Link>
          ) : (
            // Button could be disabled or show placeholder if URL fails
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-3 rounded-full bg-gray-600 px-8 py-4 text-xl font-bold"
            >
              <FaCreditCard className="text-2xl" /> Link Credit Card via
              Terminal
            </button>
          )}
        </div>

        {/* The form just calls the simple server action */}
        <form action={updateOnboardingStatus}>
          <button
            type="submit"
            disabled={!cardUrl} // Disable if URL failed
            className={`mt-6 rounded-full px-8 py-3 text-lg font-semibold transition-all ${!cardUrl ? "cursor-not-allowed bg-gray-600" : "bg-green-600 hover:bg-green-700"}`}
          >
            Done
          </button>
        </form>

        <p className="mt-4 text-center text-lg text-white/70">
          Terminal handles your payment info securely.
        </p>
      </div>
    </div>
  );
}
