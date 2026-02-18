import { describe, expect, it, vi } from "vitest";
import { createAmadeusProvider } from "../amadeus";

function jsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("AmadeusProvider", () => {
	it("maps and filters offers by maxConnections", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				jsonResponse({ access_token: "token", expires_in: 1800 }),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					data: [
						{
							id: "offer_direct",
							price: { grandTotal: "200.00", currency: "CAD" },
							itineraries: [
								{
									segments: [
										{
											carrierCode: "AC",
											number: "100",
											departure: {
												iataCode: "YYZ",
												at: "2026-03-01T08:00:00-05:00",
											},
											arrival: {
												iataCode: "YHZ",
												at: "2026-03-01T11:00:00-04:00",
											},
											duration: "PT2H",
										},
									],
								},
							],
						},
						{
							id: "offer_two_stops",
							price: { grandTotal: "180.00", currency: "CAD" },
							itineraries: [
								{
									segments: [
										{
											carrierCode: "WS",
											number: "200",
											departure: {
												iataCode: "YYZ",
												at: "2026-03-01T08:00:00-05:00",
											},
											arrival: {
												iataCode: "YOW",
												at: "2026-03-01T09:00:00-05:00",
											},
											duration: "PT1H",
										},
										{
											carrierCode: "WS",
											number: "201",
											departure: {
												iataCode: "YOW",
												at: "2026-03-01T10:00:00-05:00",
											},
											arrival: {
												iataCode: "YQM",
												at: "2026-03-01T11:00:00-04:00",
											},
											duration: "PT1H",
										},
										{
											carrierCode: "WS",
											number: "202",
											departure: {
												iataCode: "YQM",
												at: "2026-03-01T12:00:00-04:00",
											},
											arrival: {
												iataCode: "YHZ",
												at: "2026-03-01T13:00:00-04:00",
											},
											duration: "PT1H",
										},
									],
								},
							],
						},
					],
				}),
			);

		const provider = createAmadeusProvider(
			{
				clientId: "client_id",
				clientSecret: "client_secret",
				environment: "test",
			},
			fetchMock as unknown as typeof fetch,
		);

		const offers = await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2026-03-01",
			cabinClass: "economy",
			maxConnections: 1,
		});

		expect(offers).toHaveLength(1);
		expect(offers[0].id).toBe("offer_direct");
		expect(offers[0].airline).toBe("AC");
		expect(offers[0].segments[0].flightNumber).toBe("AC100");
		expect(offers[0].maxStops).toBe(0);
	});

	it("reuses cached access token between requests", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				jsonResponse({ access_token: "token", expires_in: 1800 }),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					data: [
						{
							id: "offer_1",
							price: { grandTotal: "210.00", currency: "CAD" },
							itineraries: [{ segments: [] }],
						},
					],
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					data: [
						{
							id: "offer_2",
							price: { grandTotal: "220.00", currency: "CAD" },
							itineraries: [{ segments: [] }],
						},
					],
				}),
			);

		const provider = createAmadeusProvider(
			{
				clientId: "client_id",
				clientSecret: "client_secret",
				environment: "test",
			},
			fetchMock as unknown as typeof fetch,
		);

		await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2026-03-01",
			cabinClass: "economy",
		});

		await provider.searchOffers({
			origin: "YYZ",
			destination: "YVR",
			outboundDate: "2026-03-02",
			cabinClass: "economy",
		});

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[0]?.[0]).toContain("/v1/security/oauth2/token");
		expect(fetchMock.mock.calls[1]?.[0]).toContain(
			"/v2/shopping/flight-offers",
		);
		expect(fetchMock.mock.calls[2]?.[0]).toContain(
			"/v2/shopping/flight-offers",
		);
	});

	it("sends nonStop=true when maxConnections=0", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				jsonResponse({ access_token: "token", expires_in: 1800 }),
			)
			.mockResolvedValueOnce(jsonResponse({ data: [] }));

		const provider = createAmadeusProvider(
			{
				clientId: "client_id",
				clientSecret: "client_secret",
				environment: "test",
			},
			fetchMock as unknown as typeof fetch,
		);

		await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2026-03-01",
			cabinClass: "economy",
			maxConnections: 0,
		});

		expect(fetchMock.mock.calls[1]?.[0]).toContain("nonStop=true");
	});

	it("refreshes token and retries once on 401", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				jsonResponse({ access_token: "old_token", expires_in: 1800 }),
			)
			.mockResolvedValueOnce(jsonResponse({ errors: [] }, 401))
			.mockResolvedValueOnce(
				jsonResponse({ access_token: "new_token", expires_in: 1800 }),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					data: [
						{
							id: "offer_after_retry",
							price: { grandTotal: "199.00", currency: "CAD" },
							itineraries: [{ segments: [] }],
						},
					],
				}),
			);

		const provider = createAmadeusProvider(
			{
				clientId: "client_id",
				clientSecret: "client_secret",
				environment: "test",
			},
			fetchMock as unknown as typeof fetch,
		);

		const offers = await provider.searchOffers({
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2026-03-01",
			cabinClass: "economy",
		});

		expect(offers).toHaveLength(1);
		expect(offers[0].id).toBe("offer_after_retry");
		expect(fetchMock).toHaveBeenCalledTimes(4);
	});
});
