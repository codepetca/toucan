import type { FlightOffer } from "@/lib/providers/types";

export type AlertReason =
	| { type: "price_target_met"; target: number; actual: number }
	| {
			type: "price_drop";
			previousBest: number;
			newPrice: number;
			delta: number;
	  }
	| { type: "all_time_low"; previousLow: number; newLow: number }
	| {
			type: "below_recent_average";
			average: number;
			price: number;
			percentBelow: number;
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
