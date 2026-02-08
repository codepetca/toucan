import type { AlertPayload, NotificationChannel } from "./types";

export class ConsoleNotificationChannel implements NotificationChannel {
	async send(payload: AlertPayload): Promise<void> {
		const { origin, destination, outboundDate, returnDate, reason, offer } =
			payload;
		const route = returnDate
			? `${origin} → ${destination} (${outboundDate} – ${returnDate})`
			: `${origin} → ${destination} (${outboundDate})`;

		if (reason.type === "price_target_met") {
			console.log(
				`[ALERT] ${route}: $${reason.actual} ${offer.currency} — below target of $${reason.target}. ${offer.airline} ${offer.segments[0]?.flightNumber ?? ""}`,
			);
		} else {
			console.log(
				`[ALERT] ${route}: $${reason.newPrice} ${offer.currency} — dropped $${reason.delta} from $${reason.previousBest}. ${offer.airline} ${offer.segments[0]?.flightNumber ?? ""}`,
			);
		}
	}
}
