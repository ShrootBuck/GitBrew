"use client";

import { FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react";

export default function GHSigninButton() {
  const handleSignIn = () => {
    void signIn("github");
  };

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-3 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:cursor-pointer hover:bg-[#8a69b8]"
    >
      <FaGithub className="text-2xl" /> Get Started
    </button>
  );
}
