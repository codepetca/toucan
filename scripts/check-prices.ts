import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { checkRoute } from "../src/lib/core/price-checker";
import { alerts, priceChecks, routes } from "../src/lib/db/schema";
import { ConsoleNotificationChannel } from "../src/lib/notifications/console";
import { createDuffelProvider } from "../src/lib/providers/duffel";
import type { SearchInput } from "../src/lib/providers/types";

const COOLDOWN_HOURS = 12;
const DEFAULT_CURRENCY = "CAD";

async function main() {
	const connectionString = process.env.POSTGRES_URL_NON_POOLING;
	if (!connectionString) {
		console.error("POSTGRES_URL_NON_POOLING environment variable is required");
		process.exit(1);
	}

	const duffelToken = process.env.DUFFEL_API_TOKEN;
	if (!duffelToken) {
		console.error("DUFFEL_API_TOKEN environment variable is required");
		process.exit(1);
	}

	const client = postgres(connectionString);
	const db = drizzle(client);
	const provider = createDuffelProvider(duffelToken);
	const notifier = new ConsoleNotificationChannel();
	const now = new Date();

	// Fetch all active routes
	const activeRoutes = await db
		.select()
		.from(routes)
		.where(eq(routes.isActive, true));

	console.log(`Found ${activeRoutes.length} active route(s)`);

	for (const route of activeRoutes) {
		try {
			console.log(
				`Checking ${route.origin} → ${route.destination} (${route.outboundDate})`,
			);

			// Get last price check
			const [lastCheck] = await db
				.select()
				.from(priceChecks)
				.where(eq(priceChecks.routeId, route.id))
				.orderBy(desc(priceChecks.checkedAt))
				.limit(1);

			// Get last alert
			const [lastAlert] = await db
				.select()
				.from(alerts)
				.where(eq(alerts.routeId, route.id))
				.orderBy(desc(alerts.alertedAt))
				.limit(1);

			// Search via Duffel
			const searchInput: SearchInput = {
				origin: route.origin,
				destination: route.destination,
				outboundDate: route.outboundDate,
				returnDate: route.returnDate ?? undefined,
				cabinClass: route.cabinClass as SearchInput["cabinClass"],
			};

			const offers = await provider.searchOffers(searchInput);
			console.log(`  Found ${offers.length} offer(s)`);

			// Run price-checker logic
			const result = checkRoute(
				{
					priceTarget: route.priceTarget ? Number(route.priceTarget) : null,
					priceDropDelta: route.priceDropDelta
						? Number(route.priceDropDelta)
						: null,
					currency: DEFAULT_CURRENCY,
				},
				offers,
				lastCheck ? Number(lastCheck.bestPrice) : null,
				lastAlert ? lastAlert.alertedAt : null,
				COOLDOWN_HOURS,
				now,
			);

			// Write price_check row
			if (result.bestOffer) {
				await db.insert(priceChecks).values({
					routeId: route.id,
					bestPrice: result.bestOffer.totalAmount.toString(),
					currency: result.bestOffer.currency,
					airline: result.bestOffer.airline,
					offerCount: offers.filter((o) => o.currency === DEFAULT_CURRENCY)
						.length,
					bestOffer: {
						segments: result.bestOffer.segments,
					},
				});
				console.log(
					`  Best price: $${result.bestOffer.totalAmount} ${result.bestOffer.currency}`,
				);
			}

			// Write alert row + notify if triggered
			if (result.alert) {
				const { reason, offer } = result.alert;

				await db.insert(alerts).values({
					routeId: route.id,
					reasonType: reason.type,
					price: offer.totalAmount.toString(),
					previousBest:
						reason.type === "price_drop"
							? reason.previousBest.toString()
							: null,
					offerSummary: {
						airline: offer.airline,
						segments: offer.segments,
					},
				});

				await notifier.send({
					origin: route.origin,
					destination: route.destination,
					outboundDate: route.outboundDate,
					returnDate: route.returnDate ?? undefined,
					reason,
					offer,
				});
			}
		} catch (err) {
			console.error(
				`Error checking ${route.origin} → ${route.destination}:`,
				err,
			);
		}
	}

	console.log("Done.");
	await client.end();
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
