import { Duffel } from "@duffel/api";
import type {
	FlightOffer,
	FlightSearchProvider,
	FlightSegment,
	SearchInput,
} from "./types";

export class DuffelProvider implements FlightSearchProvider {
	constructor(private duffel: Duffel) {}

	async searchOffers(input: SearchInput): Promise<FlightOffer[]> {
		const slices: {
			origin: string;
			destination: string;
			departure_date: string;
		}[] = [
			{
				origin: input.origin,
				destination: input.destination,
				departure_date: input.outboundDate,
			},
		];

		if (input.returnDate) {
			slices.push({
				origin: input.destination,
				destination: input.origin,
				departure_date: input.returnDate,
			});
		}

		const response = await this.duffel.offerRequests.create({
			slices,
			passengers: [{ type: "adult" }],
			cabin_class: input.cabinClass,
			...(input.maxConnections !== undefined && {
				max_connections: input.maxConnections,
			}),
		});

		const offers = response.data.offers ?? [];

		return offers.map((offer): FlightOffer => {
			const segments: FlightSegment[] = offer.slices.flatMap((slice) =>
				slice.segments.map((seg) => ({
					airline:
						seg.operating_carrier?.name ??
						seg.marketing_carrier?.name ??
						"Unknown",
					flightNumber:
						seg.operating_carrier_flight_number ??
						seg.marketing_carrier_flight_number ??
						"",
					departingAt: seg.departing_at,
					arrivingAt: seg.arriving_at,
					origin: seg.origin.iata_code ?? seg.origin.iata_city_code ?? "",
					destination:
						seg.destination.iata_code ?? seg.destination.iata_city_code ?? "",
					duration: seg.duration ?? undefined,
				})),
			);

			const firstSegment = segments[0];

			return {
				id: offer.id,
				totalAmount: Number.parseFloat(offer.total_amount),
				currency: offer.total_currency,
				airline: firstSegment?.airline ?? "Unknown",
				segments,
			};
		});
	}
}

export function createDuffelProvider(token: string): DuffelProvider {
	const duffel = new Duffel({ token });
	return new DuffelProvider(duffel);
}
