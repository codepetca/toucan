import type { FlightOffer } from "@/lib/providers/types";

export type AlertReason =
	| { type: "price_target_met"; target: number; actual: number }
	| {
			type: "price_drop";
			previousBest: number;
			newPrice: number;
			delta: number;
	  };

export interface AlertPayload {
	origin: string;
	destination: string;
	outboundDate: string;
	returnDate?: string;
	reason: AlertReason;
	offer: FlightOffer;
}

export interface NotificationChannel {
	send(payload: AlertPayload): Promise<void>;
}
