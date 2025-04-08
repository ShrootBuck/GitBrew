import Terminal from "@terminaldotshop/sdk";
import { db } from "~/server/db";
import { env } from "~/env";
import { getValidTerminalToken } from "./terminalUtils"; // Adjust path as needed

// Helper to pick a random item from an array
// Thanks Claude
function getRandomElement<T>(arr: T[]): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function processPendingCoffeeOrders() {
  const usersToReward = await db.user.findMany({
    where: {
      coffeePending: true,
      terminalAccessToken: { not: null },
      terminalRefreshToken: { not: null },
      addressId: { not: null },
      defaultCardId: { not: null }, // MUST have a default card set
    },
    select: {
      id: true,
      terminalAccessToken: true,
      terminalRefreshToken: true,
      addressId: true,
      defaultCardId: true,
    },
  });

  console.log(
    `[CoffeeProcessor] Found ${usersToReward.length} users pending coffee rewards.`,
  );

  for (const user of usersToReward) {
    console.log(`[CoffeeProcessor] Processing user ${user.id}...`);
    try {
      // Get Valid Token (Handles Refresh)
      const accessToken = await getValidTerminalToken(user.id);

      const terminal = new Terminal({
        bearerToken: accessToken,
        baseURL: env.TERMINAL_API_URL,
      });

      // Get Available Products (for random selection)
      const productsResponse: Terminal.ProductListResponse =
        await terminal.product.list();
      if (!productsResponse.data || productsResponse.data.length === 0) {
        throw new Error(`No products found in Terminal shop.`);
      }

      // Get all variants and pick a random one
      const allVariants = productsResponse.data.flatMap(
        (p: Terminal.Product) => p.variants ?? [],
      );

      if (allVariants.length === 0) {
        throw new Error(`No product variants found to order.`);
      }

      const randomVariant = getRandomElement(allVariants);
      if (!randomVariant) {
        throw new Error(`Could not select a random variant ID.`);
      }
      const coffeeVariantId = randomVariant.id;
      console.log(
        `[CoffeeProcessor] Selected random variant ${coffeeVariantId} for user ${user.id}.`,
      );

      const defaultAddressId = user.addressId!;
      const defaultCardId = user.defaultCardId!; // fuck you typescript

      const orderPayload = {
        variants: { [coffeeVariantId]: 1 }, // Order 1 unit of the random variant
        cardID: defaultCardId,
        addressID: defaultAddressId,
      };

      console.log(
        `[CoffeeProcessor] Attempting to order coffee for user ${user.id} with payload:`,
        orderPayload,
      );

      //  Place the order using POST /order
      const orderResponse = await terminal.order.create(orderPayload);

      console.log(
        `[CoffeeProcessor] Successfully placed order ${orderResponse.data} for user ${user.id}.`,
      );

      // Update User record on success
      await db.user.update({
        where: { id: user.id },
        data: {
          coffeePending: false,
          currentStreak: 0,
        },
      });
      console.log(
        `[CoffeeProcessor] User ${user.id} record updated after successful order.`,
      );
    } catch (error: unknown) {
      console.error(
        `[CoffeeProcessor] Failed processing for user ${user.id}:`,
        error instanceof Error ? error.message : error,
      );
      // Handle specific errors (like no address/card) vs temporary ones
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      const isSetupError =
        errorMessage.includes("no shipping address") ||
        errorMessage.includes("no payment card") ||
        errorMessage.includes("missing terminal token");

      if (isSetupError) {
        console.log(
          `[CoffeeProcessor] Setup error for user ${user.id}. Clearing pending flag and setting setup flag.`,
        );
        await db.user.update({
          where: { id: user.id },
          data: {
            coffeePending: false, // Give up :pensive:
          },
        });
      } else {
        // Assume temporary network/API issue, will retry on next cron run
        console.log(
          `[CoffeeProcessor] Order attempt for user ${user.id} failed (maybe temporary), will retry later.`,
        );
      }
    }
  }
  console.log("[CoffeeProcessor] Finished processing batch.");
}
