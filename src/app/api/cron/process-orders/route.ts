// src/app/api/cron/process-orders/route.ts
import { NextResponse } from "next/server";
import { processPendingCoffeeOrders } from "~/server/coffeeProcessor"; // Adjust path
import { env } from "~/env";

// Secure this endpoint! Vercel uses Authorization: Bearer <CRON_SECRET>
// Add CRON_SECRET to your Vercel project environment variables.
export async function GET(request: Request) {
  const expectedSecret = env.CRON_SECRET; // Ensure CRON_SECRET is in env.js and .env
  const providedToken = request.headers
    .get("authorization")
    ?.split("Bearer ")[1];

  if (!expectedSecret || providedToken !== expectedSecret) {
    console.warn(
      "Unauthorized cron job access attempt to /api/cron/process-orders",
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Don't run jobs for too long - Vercel Hobby tier has short limits
  // Consider returning early if processing takes > 10-15 seconds? (More complex logic)
  try {
    console.log("Cron job /api/cron/process-orders starting...");
    await processPendingCoffeeOrders();
    console.log("Cron job /api/cron/process-orders finished successfully.");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error running processPendingCoffeeOrders cron job:", error);
    // Don't expose detailed errors generally
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
