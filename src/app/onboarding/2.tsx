import { FaCoffee } from "react-icons/fa";
import Link from "next/link";

export default function TerminalConnect() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Connect to Terminal
        </h2>

        <div className="max-w-2xl text-center text-xl">
          <p className="mb-4">
            To continue, please connect your account to Terminal.
          </p>
          <p>This connection is required to order and ship your coffee.</p>
        </div>

        <div className="terminal-connect-button-container">
          <Link
            href="/api/oauth"
            className="flex items-center gap-3 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:bg-[#8a69b8]"
          >
            <FaCoffee className="text-2xl" /> Connect to Terminal
          </Link>
        </div>

        <p className="mt-4 text-center text-lg text-white/70">
          Your account will be securely connected to Terminal to process your
          coffee orders.
        </p>
      </div>
    </div>
  );
}
