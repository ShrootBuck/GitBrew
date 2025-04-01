// src/app/settings/address/page.tsx
import { FaMapMarkerAlt } from "react-icons/fa";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export default async function SettingsAddressPage() {
  const session = await auth();

  // Gotta be logged in, obviously
  if (!session) {
    redirect("/");
  }

  const userId = session.user.id;

  // --- Server Action to rewind onboarding ---
  async function rewindToAddressStep() {
    try {
      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: { onboardingStatus: true }, // Just get what we need
      });

      // Only update if they've actually finished onboarding
      if (currentUser?.onboardingStatus === 4) {
        await db.user.update({
          where: { id: userId },
          data: {
            onboardingStatus: 3,
          },
        });
        console.log(
          `User ${userId} opted to re-enter address. Status set to 3.`,
        );
      } else {
        // If they aren't fully onboarded, just send them to the root
        // which will figure out where they *should* be.
        console.log(
          `User ${userId} tried to change address but isn't fully onboarded (Status: ${currentUser?.onboardingStatus}). Redirecting to root.`,
        );
      }
    } catch (error) {
      console.error(
        `Failed to update onboarding status for user ${userId} to change address:`,
        error,
      );
      // Maybe redirect with an error later, for now just log and proceed
    }

    // Send them back to the main page, the router there will handle the rest
    redirect("/");
  }
  // --- End Server Action ---

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex max-w-lg flex-col items-center justify-center gap-8 rounded-xl border border-white/10 bg-white/5 px-8 py-12 shadow-lg">
        <FaMapMarkerAlt className="mb-2 text-5xl text-blue-400" />

        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Manage Shipping Address
        </h2>

        <p className="text-center text-lg text-white/80">
          Need to update where we send your coffee? Click the button below to
          re-enter your shipping address.
        </p>

        {/* Form calling the server action */}
        <form action={rewindToAddressStep}>
          <button
            type="submit"
            className="mt-4 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:cursor-pointer hover:bg-[#8a69b8]"
          >
            Change Shipping Address
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          You&apos;ll be taken back to the address entry step.
        </p>
      </div>
    </main>
  );
}
