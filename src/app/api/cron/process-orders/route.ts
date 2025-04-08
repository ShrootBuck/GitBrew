import { NextResponse } from "next/server";
import { processPendingCoffeeOrders } from "~/server/coffeeProcessor";
import { env } from "~/env";

export async function GET(request: Request) {
  const expectedSecret = env.CRON_SECRET;
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
  // Consider returning early if processing takes > 10-15 seconds?
  try {
    console.log("Cron job /api/cron/process-orders starting...");
    await processPendingCoffeeOrders();
    console.log("Cron job /api/cron/process-orders finished successfully.");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error running processPendingCoffeeOrders cron job:", error);

    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
