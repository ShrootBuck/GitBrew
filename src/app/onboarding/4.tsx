// src/app/onboarding/4.tsx

import { redirect } from "next/navigation";
import { Terminal } from "@terminaldotshop/sdk";
import { env } from "~/env";
import { getValidTerminalToken } from "~/server/terminalUtils";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export default async function AddressForm() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Enter Your Shipping Address
        </h2>
        <form
          action={saveAddress}
          className="flex w-full max-w-md flex-col gap-4"
        >
          <input
            type="text"
            name="name"
            defaultValue="John Doe"
            placeholder="Full Name"
            className="rounded px-4 py-2 text-black"
            required
          />
          <input
            type="text"
            name="street1"
            defaultValue="123 Main St"
            placeholder="Street Address"
            className="rounded px-4 py-2 text-black"
            required
          />
          <input
            type="text"
            name="city"
            defaultValue="Anytown"
            placeholder="City"
            className="rounded px-4 py-2 text-black"
            required
          />
          <input
            type="text"
            name="zip"
            defaultValue="12345"
            placeholder="ZIP Code"
            className="rounded px-4 py-2 text-black"
            required
          />
          <button
            type="submit"
            className="mt-4 rounded-full bg-[#6e5494] px-8 py-4 text-xl font-bold transition-all hover:bg-[#8a69b8]"
          >
            Submit Address
          </button>
        </form>
      </div>
    </div>
  );
}

async function saveAddress(formData: FormData) {
  "use server";

  try {
    // Get the session data
    const session = await auth();

    if (!session) {
      throw new Error("User ID not found");
    }

    // Get address info from the form
    const name = formData.get("name") as string;
    const street1 = formData.get("street1") as string;
    const city = formData.get("city") as string;
    const zip = formData.get("zip") as string;

    // Validate required fields
    if (!name || !street1 || !city || !zip) {
      throw new Error("All address fields are required");
    }

    const accessToken = await getValidTerminalToken(session.user.id);

    // Instantiate Terminal SDK
    const terminal = new Terminal({
      bearerToken: accessToken,
      baseURL: env.TERMINAL_API_URL,
    });

    const address = await terminal.address.create({
      city,
      country: "US",
      name,
      street1,
      zip,
    });

    await db.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStatus: 4,
        addressId: address.data,
      },
    });

    redirect("/loading");
  } catch (error) {
    console.error("Error updating address:", error);
    throw new Error("Something went wrong. Try again.");
  }
}
