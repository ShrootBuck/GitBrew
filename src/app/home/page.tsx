import { auth, signOut } from "~/server/auth";
import { db } from "~/server/db";
import Image from "next/image";
import Link from "next/link";
import { FaFire, FaCoffee } from "react-icons/fa";
import UserDropdown from "./user-dropdown";

// Define the type of dropdown items based on the expected interface
type IconName = "FaCreditCard" | "FaMapMarkerAlt" | "FaCog" | "FaSignOutAlt";

export default async function Dashboard() {
  const session = await auth();

  const user = await db.user.findUnique({
    where: { id: session?.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      currentStreak: true,
      lastCommitDate: true,
      coffeePending: true,
    },
  });

  // If user data somehow isn't found after login, something's wrong
  if (!user) {
    console.error(
      `Dashboard: User data not found for session user ${session?.user.id}`,
    );
    // Maybe redirect to an error page or force sign out?
    await signOut({ redirect: true, redirectTo: "/" });
    return null; // Stop rendering
  }

  const coffeeTarget = 14; // Define your target streak
  const daysLeft = Math.max(0, coffeeTarget - user.currentStreak);

  // Props for the UserDropdown client component
  const dropdownItems = [
    // You'll need to implement these href destinations or actions
    {
      label: "Manage Payment",
      href: "/settings/payment",
      icon: "FaCreditCard" as IconName,
    },
    {
      label: "Manage Address",
      href: "/settings/address",
      icon: "FaMapMarkerAlt" as IconName,
    },
    { label: "Settings", href: "/settings", icon: "FaCog" as IconName },
    {
      label: "Sign Out",
      action: async () => {
        "use server";
        await signOut({ redirect: true, redirectTo: "/" });
      },
      icon: "FaSignOutAlt" as IconName,
    },
    // Add other links like "Help", etc. if needed
  ];

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      {/* Header Bar */}
      <header className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Git Brew Logo" width={32} height={32} />
          <h1 className="hidden text-2xl font-bold sm:block">
            {" "}
            {/* Hide text on very small screens */}
            Git <span className="text-[#6e5494]">Brew</span>
          </h1>
        </Link>
        {/* Render the client component for the dropdown */}
        <UserDropdown
          userImage={session?.user.image}
          userName={session?.user.name}
          items={dropdownItems}
        />
      </header>

      {/* Main Content Area */}
      <div className="container mx-auto flex flex-grow flex-col items-center justify-center gap-8 px-4 py-10 md:px-6">
        <h2 className="text-center text-3xl font-bold md:text-4xl">
          Welcome, {session?.user.name?.split(" ")[0] ?? "Developer"}!
        </h2>

        {/* Streak Display Card */}
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-lg sm:p-8">
          <FaFire
            className={`text-7xl transition-colors duration-300 ${user.currentStreak > 0 ? "text-orange-500" : "text-white/30"}`}
          />
          <p className="text-5xl font-extrabold sm:text-6xl">
            {user.currentStreak}
          </p>
          <p className="text-xl font-semibold text-white/90">Day Streak</p>
          {user.lastCommitDate && (
            <p className="text-sm text-white/60">
              Keep it going! Last commit:{" "}
              {new Date(user.lastCommitDate).toLocaleDateString()}
            </p>
          )}
          {/* Optional Progress Bar */}
          <div className="mt-3 h-2.5 w-full rounded-full bg-gray-700">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${user.currentStreak > 0 ? "bg-gradient-to-r from-orange-400 to-red-500" : "bg-transparent"}`}
              style={{
                width: `${Math.min((user.currentStreak / coffeeTarget) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Coffee Status Card */}
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-lg">
          <FaCoffee
            className={`text-5xl transition-colors duration-300 ${user.coffeePending ? "animate-pulse text-amber-500" : user.currentStreak >= coffeeTarget ? "text-green-500" : "text-white/30"}`}
          />
          {user.coffeePending ? (
            <>
              <p className="text-xl font-semibold text-amber-400">
                Reward Pending!
              </p>
              <p className="text-white/70">
                Your coffee order is being processed.
              </p>
            </>
          ) : user.currentStreak >= coffeeTarget ? (
            // This case might mean the webhook hasn't run yet or failed? Or streak reset logic needs check.
            <>
              <p className="text-xl font-semibold text-green-400">
                Streak Complete!
              </p>
              <p className="text-white/70">Processing your reward soon...</p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold">
                {daysLeft} Day{daysLeft !== 1 ? "s" : ""} to Coffee
              </p>
              <p className="text-white/70">Commit daily to earn your brew!</p>
            </>
          )}
        </div>

        {/* You could add other elements here - recent activity, leaderboard snippet, etc. */}
      </div>

      {/* Simple Footer */}
      <footer className="container mx-auto px-4 py-6 text-center text-sm text-white/50">
        Keep Coding. Keep Brewing.
      </footer>
    </main>
  );
}
