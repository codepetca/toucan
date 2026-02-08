import { describe, expect, it, vi } from "vitest";
import { DuffelProvider } from "../duffel";

function makeDuffelOffer(overrides: Record<string, unknown> = {}) {
	return {
		id: "off_123",
		total_amount: "299.50",
		total_currency: "CAD",
		slices: [
			{
				segments: [
					{
						operating_carrier: { name: "Porter Airlines" },
						marketing_carrier: { name: "Porter Airlines" },
						operating_carrier_flight_number: "PD100",
						marketing_carrier_flight_number: "PD100",
						departing_at: "2025-06-15T08:00:00",
						arriving_at: "2025-06-15T12:00:00",
						origin: { iata_code: "YYZ", iata_city_code: "YTO" },
						destination: { iata_code: "YHZ", iata_city_code: "YHZ" },
						duration: "PT4H",
					},
				],
			},
		],
		...overrides,
	};
}

function makeMockDuffel(offers: unknown[]) {
	return {
		offerRequests: {
			create: vi.fn().mockResolvedValue({
				data: { offers },
			}),
		},
	} as unknown;
}

describe("DuffelProvider", () => {
	it("maps a one-way offer correctly", async () => {
		const duffel = makeMockDuffel([makeDuffelOffer()]);
		const provider = new DuffelProvider(duffel as never);

		const offers = await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2025-06-15",
			cabinClass: "economy",
		});

		expect(offers).toHaveLength(1);
		expect(offers[0].id).toBe("off_123");
		expect(offers[0].totalAmount).toBe(299.5);
		expect(offers[0].currency).toBe("CAD");
		expect(offers[0].airline).toBe("Porter Airlines");
		expect(offers[0].segments).toHaveLength(1);
		expect(offers[0].segments[0].flightNumber).toBe("PD100");
		expect(offers[0].segments[0].origin).toBe("YYZ");
		expect(offers[0].segments[0].destination).toBe("YHZ");
	});

	it("maps a round-trip offer with 2 slices", async () => {
		const roundTripOffer = {
			...makeDuffelOffer(),
			slices: [
				{
					segments: [
						{
							operating_carrier: { name: "Air Canada" },
							marketing_carrier: { name: "Air Canada" },
							operating_carrier_flight_number: "AC600",
							marketing_carrier_flight_number: "AC600",
							departing_at: "2025-06-15T08:00:00",
							arriving_at: "2025-06-15T12:00:00",
							origin: { iata_code: "YYZ", iata_city_code: "YTO" },
							destination: { iata_code: "YHZ", iata_city_code: "YHZ" },
							duration: "PT4H",
						},
					],
				},
				{
					segments: [
						{
							operating_carrier: { name: "Air Canada" },
							marketing_carrier: { name: "Air Canada" },
							operating_carrier_flight_number: "AC601",
							marketing_carrier_flight_number: "AC601",
							departing_at: "2025-06-20T14:00:00",
							arriving_at: "2025-06-20T18:00:00",
							origin: { iata_code: "YHZ", iata_city_code: "YHZ" },
							destination: { iata_code: "YYZ", iata_city_code: "YTO" },
							duration: "PT4H",
						},
					],
				},
			],
		};

		const duffel = makeMockDuffel([roundTripOffer]);
		const provider = new DuffelProvider(duffel as never);

		const offers = await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2025-06-15",
			returnDate: "2025-06-20",
			cabinClass: "economy",
		});

		expect(offers).toHaveLength(1);
		expect(offers[0].segments).toHaveLength(2);
		expect(offers[0].segments[0].flightNumber).toBe("AC600");
		expect(offers[0].segments[1].flightNumber).toBe("AC601");
	});

	it("handles null operating_carrier gracefully", async () => {
		const offer = makeDuffelOffer();
		(offer.slices[0].segments[0] as Record<string, unknown>).operating_carrier =
			null;

		const duffel = makeMockDuffel([offer]);
		const provider = new DuffelProvider(duffel as never);

		const offers = await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2025-06-15",
			cabinClass: "economy",
		});

		expect(offers[0].segments[0].airline).toBe("Porter Airlines"); // falls back to marketing_carrier
	});

	it("passes correct slices for one-way vs round-trip", async () => {
		const duffel = makeMockDuffel([]);
		const provider = new DuffelProvider(duffel as never);

		// One-way
		await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2025-06-15",
			cabinClass: "economy",
		});

		const createFn = (
			duffel as { offerRequests: { create: ReturnType<typeof vi.fn> } }
		).offerRequests.create;
		expect(createFn).toHaveBeenCalledWith(
			expect.objectContaining({
				slices: [
					{
						origin: "YYZ",
						destination: "YHZ",
						departure_date: "2025-06-15",
					},
				],
			}),
		);

		// Round-trip
		await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2025-06-15",
			returnDate: "2025-06-20",
			cabinClass: "economy",
		});

		expect(createFn).toHaveBeenLastCalledWith(
			expect.objectContaining({
				slices: [
					{
						origin: "YYZ",
						destination: "YHZ",
						departure_date: "2025-06-15",
					},
					{
						origin: "YHZ",
						destination: "YYZ",
						departure_date: "2025-06-20",
					},
				],
			}),
		);
	});
});
