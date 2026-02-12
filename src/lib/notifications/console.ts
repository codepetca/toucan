import type { AlertPayload, NotificationChannel } from "./types";

export class ConsoleNotificationChannel implements NotificationChannel {
	async send(payload: AlertPayload): Promise<void> {
		const { origin, destination, outboundDate, returnDate, reason, offer } =
			payload;
		const route = returnDate
			? `${origin} → ${destination} (${outboundDate} – ${returnDate})`
			: `${origin} → ${destination} (${outboundDate})`;
		const flight = `${offer.airline} ${offer.segments[0]?.flightNumber ?? ""}`;

		switch (reason.type) {
			case "price_target_met":
				console.log(
					`[ALERT] ${route}: $${reason.actual} ${offer.currency} — below target of $${reason.target}. ${flight}`,
				);
				break;
			case "price_drop":
				console.log(
					`[ALERT] ${route}: $${reason.newPrice} ${offer.currency} — dropped $${reason.delta} from $${reason.previousBest}. ${flight}`,
				);
				break;
			case "all_time_low":
				console.log(
					`[ALERT] ${route}: $${reason.newLow} ${offer.currency} — new all-time low (previous: $${reason.previousLow}). ${flight}`,
				);
				break;
			case "below_recent_average":
				console.log(
					`[ALERT] ${route}: $${reason.price} ${offer.currency} — ${Math.round(reason.percentBelow * 100)}% below recent average of $${Math.round(reason.average)}. ${flight}`,
				);
				break;
		}
	}
}
