import { FaExclamationTriangle, FaTrashAlt } from "react-icons/fa";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "~/server/auth";
import { db } from "~/server/db";

async function deleteUserAccount() {
  "use server";

  const session = await auth();
  if (!session) {
    console.error("Attempted account deletion without being authenticated.");
    redirect("/");
  }

  const userId = session.user.id;

  console.warn(
    `[Account Deletion] Starting deletion process for user: ${userId}`,
  );

  try {
    await db.user.delete({
      where: { id: userId },
    });
    console.log(
      `[Account Deletion] Deleted user record (and cascaded deletes): ${userId}`,
    );

    // Still might want specific cleanup for external services like Terminal if possible,
    // but cascade handles the DB relations.
  } catch (error) {
    console.error(`[Account Deletion] Failed for user ${userId}:`, error);
    // Redirect or throw, depending on how gracefully you want to fail.
    throw new Error(
      "Account deletion failed. Check cascade settings or contact support.",
    );
  }

  // Sign the user out after successful deletion
  console.log(`[Account Deletion] Signing out user: ${userId}`);
  await signOut({ redirect: true, redirectTo: "/" });
}

export default async function DeleteAccountPage() {
  // ... (rest of the component is unchanged) ...
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex max-w-lg flex-col items-center justify-center gap-6 rounded-xl border border-red-500/50 bg-red-900/20 px-8 py-12 shadow-lg">
        <FaExclamationTriangle className="mb-2 text-6xl text-red-400" />

        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Delete Your Account
        </h2>

        <p className="text-center text-lg text-red-200/80">
          Please confirm your decision to delete your account. This action is{" "}
          <strong className="font-bold">permanent</strong>. All your data,
          streak progress, and pending rewards will be permanently removed. Your
          billing information will also be deleted, and you will not be charged
          for any future caffeinations.
        </p>

        <form
          action={deleteUserAccount}
          className="mt-4 flex w-full flex-col items-center gap-4"
        >
          <button
            type="submit"
            className="w-full rounded-full bg-red-600 px-8 py-4 text-xl font-bold text-white transition-all hover:cursor-pointer hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
          >
            <FaTrashAlt className="mr-2 inline-block" /> Confirm Account
            Deletion
          </button>
          <Link
            href="/home"
            className="w-full rounded-full border border-white/30 bg-transparent px-8 py-3 text-center text-lg font-semibold text-white/80 transition-all hover:border-white/60 hover:bg-white/10"
          >
            Cancel and Return to Home
          </Link>
        </form>

        <p className="mt-4 text-center text-sm text-red-200/60">
          This action cannot be undone. Please ensure you have backed up any
          important information.
        </p>
      </div>
    </main>
  );
}
