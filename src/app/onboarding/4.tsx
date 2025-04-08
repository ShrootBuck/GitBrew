import { redirect } from "next/navigation";
import { Terminal } from "@terminaldotshop/sdk";
import { env } from "~/env";
import { getValidTerminalToken } from "~/server/terminalUtils";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { FaMapMarkerAlt } from "react-icons/fa";

export default async function AddressForm() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
          <FaMapMarkerAlt className="text-3xl text-blue-400" />
        </div>

        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Where Should We Send Your Coffee?
        </h2>

        <div className="max-w-2xl text-center text-xl">
          <p>
            Enter your shipping address below to tell Terminal where to send
            your coffee.
          </p>
          <p className="mt-2 text-white/70">
            Note: Currently only US addresses are supported.
          </p>
        </div>

        <form
          action={saveAddress}
          className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="rounded border border-white/20 bg-gray-800/60 px-4 py-3 text-white placeholder-white/50 focus:border-[#6e5494] focus:ring-1 focus:ring-[#6e5494] focus:outline-none"
            required
          />
          <input
            type="text"
            name="street1"
            placeholder="Street Address"
            className="rounded border border-white/20 bg-gray-800/60 px-4 py-3 text-white placeholder-white/50 focus:border-[#6e5494] focus:ring-1 focus:ring-[#6e5494] focus:outline-none"
            required
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            className="rounded border border-white/20 bg-gray-800/60 px-4 py-3 text-white placeholder-white/50 focus:border-[#6e5494] focus:ring-1 focus:ring-[#6e5494] focus:outline-none"
            required
          />
          <input
            type="text"
            name="zip"
            placeholder="ZIP Code"
            className="rounded border border-white/20 bg-gray-800/60 px-4 py-3 text-white placeholder-white/50 focus:border-[#6e5494] focus:ring-1 focus:ring-[#6e5494] focus:outline-none"
            required
          />
          <button
            type="submit"
            className="mt-4 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:cursor-pointer hover:bg-[#8a69b8]"
          >
            Save Address & Finish
          </button>
        </form>

        <p className="mt-4 text-center text-lg text-white/70">
          Your address is securely stored via Terminal.
        </p>
      </div>
    </div>
  );
}

async function saveAddress(formData: FormData) {
  "use server";

  try {
    const session = await auth();
    if (!session) {
      throw new Error("User not authenticated");
    }
    const userId = session.user.id;

    const name = formData.get("name") as string;
    const street1 = formData.get("street1") as string;
    const city = formData.get("city") as string;
    const zip = formData.get("zip") as string;

    if (!name || !street1 || !city || !zip) {
      throw new Error("All address fields are required");
    }

    const accessToken = await getValidTerminalToken(userId);

    const terminal = new Terminal({
      bearerToken: accessToken,
      baseURL: env.TERMINAL_API_URL,
    });

    const address = await terminal.address.create({
      city,
      country: "US", // Only US addresses are supported by Terminal API (according to docs)
      name,
      street1,
      zip,
    });

    await db.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: 4,
        addressId: address.data,
      },
    });
  } catch (error) {
    console.error("Error saving address:", error);
    throw new Error("Failed to save address. Please try again.");
  }

  redirect("/loading");
}
