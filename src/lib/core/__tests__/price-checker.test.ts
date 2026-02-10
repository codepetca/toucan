import type { FlightOffer } from "@/lib/providers/types";
import { describe, expect, it } from "vitest";
import { type RouteConfig, checkRoute } from "../price-checker";

function makeOffer(overrides: Partial<FlightOffer> = {}): FlightOffer {
	return {
		id: "offer-1",
		totalAmount: 200,
		currency: "CAD",
		airline: "Porter Airlines",
		segments: [
			{
				airline: "Porter Airlines",
				flightNumber: "PD100",
				departingAt: "2025-06-15T08:00:00",
				arrivingAt: "2025-06-15T12:00:00",
				origin: "YYZ",
				destination: "YHZ",
			},
		],
		maxStops: 0,
		...overrides,
	};
}

const baseRoute: RouteConfig = {
	priceTarget: 180,
	priceDropDelta: 20,
	currency: "CAD",
};

const now = new Date("2025-06-01T12:00:00Z");

describe("checkRoute", () => {
	it("returns no changes when there are no offers", () => {
		const result = checkRoute(baseRoute, [], null, null, 12, now);
		expect(result.newBestPrice).toBeNull();
		expect(result.bestOffer).toBeNull();
		expect(result.alert).toBeNull();
	});

	it("sets initial best price on first check", () => {
		const offers = [makeOffer({ totalAmount: 250 })];
		const result = checkRoute(baseRoute, offers, null, null, 12, now);
		expect(result.newBestPrice).toBe(250);
		expect(result.bestOffer?.totalAmount).toBe(250);
		expect(result.alert).toBeNull(); // 250 > target 180, no drop since first check
	});

	it("alerts when price meets target", () => {
		const offers = [makeOffer({ totalAmount: 170 })];
		const result = checkRoute(baseRoute, offers, 250, null, 12, now);
		expect(result.alert).not.toBeNull();
		expect(result.alert?.reason.type).toBe("price_target_met");
		if (result.alert?.reason.type === "price_target_met") {
			expect(result.alert.reason.target).toBe(180);
			expect(result.alert.reason.actual).toBe(170);
		}
	});

	it("alerts when price drops by >= delta", () => {
		const offers = [makeOffer({ totalAmount: 225 })];
		const route: RouteConfig = {
			priceTarget: null,
			priceDropDelta: 20,
			currency: "CAD",
		};
		const result = checkRoute(route, offers, 250, null, 12, now);
		expect(result.alert).not.toBeNull();
		expect(result.alert?.reason.type).toBe("price_drop");
		if (result.alert?.reason.type === "price_drop") {
			expect(result.alert.reason.previousBest).toBe(250);
			expect(result.alert.reason.newPrice).toBe(225);
			expect(result.alert.reason.delta).toBe(25);
		}
	});

	it("does not alert when drop is less than delta", () => {
		const offers = [makeOffer({ totalAmount: 240 })];
		const route: RouteConfig = {
			priceTarget: null,
			priceDropDelta: 20,
			currency: "CAD",
		};
		const result = checkRoute(route, offers, 250, null, 12, now);
		expect(result.alert).toBeNull();
	});

	it("suppresses alert within cooldown period", () => {
		const offers = [makeOffer({ totalAmount: 170 })];
		const lastAlerted = new Date("2025-06-01T06:00:00Z"); // 6 hours ago
		const result = checkRoute(baseRoute, offers, 200, lastAlerted, 12, now);
		// 170 meets target but cooldown (6 hours < 12 hours)
		// However, 170 < 200 (lastBestPrice) → new all-time low → bypasses cooldown
		expect(result.alert).not.toBeNull();
	});

	it("respects cooldown when not a new all-time low", () => {
		const offers = [makeOffer({ totalAmount: 170 })];
		const lastAlerted = new Date("2025-06-01T06:00:00Z"); // 6 hours ago
		// lastBestPrice 150 — so 170 is NOT a new all-time low
		const result = checkRoute(baseRoute, offers, 150, lastAlerted, 12, now);
		expect(result.alert).toBeNull();
	});

	it("bypasses cooldown for new all-time low", () => {
		const offers = [makeOffer({ totalAmount: 140 })];
		const lastAlerted = new Date("2025-06-01T06:00:00Z"); // 6 hours ago
		const result = checkRoute(baseRoute, offers, 150, lastAlerted, 12, now);
		expect(result.alert).not.toBeNull();
	});

	it("filters out offers with wrong currency", () => {
		const offers = [
			makeOffer({ totalAmount: 100, currency: "USD" }),
			makeOffer({ id: "offer-2", totalAmount: 250, currency: "CAD" }),
		];
		const result = checkRoute(baseRoute, offers, null, null, 12, now);
		expect(result.bestOffer?.currency).toBe("CAD");
		expect(result.bestOffer?.totalAmount).toBe(250);
	});

	it("returns no changes when all offers have wrong currency", () => {
		const offers = [makeOffer({ totalAmount: 100, currency: "USD" })];
		const result = checkRoute(baseRoute, offers, 200, null, 12, now);
		expect(result.newBestPrice).toBe(200);
		expect(result.bestOffer).toBeNull();
		expect(result.alert).toBeNull();
	});

	it("updates best price to new low", () => {
		const offers = [makeOffer({ totalAmount: 190 })];
		const result = checkRoute(baseRoute, offers, 220, null, 12, now);
		expect(result.newBestPrice).toBe(190);
	});

	it("keeps existing best price when current is higher", () => {
		const offers = [makeOffer({ totalAmount: 260 })];
		const result = checkRoute(baseRoute, offers, 220, null, 12, now);
		expect(result.newBestPrice).toBe(220);
	});

	it("prefers price_target_met over price_drop when both apply", () => {
		const offers = [makeOffer({ totalAmount: 170 })];
		const result = checkRoute(baseRoute, offers, 250, null, 12, now);
		// 170 <= 180 target AND 250 - 170 = 80 >= 20 delta
		// Should pick price_target_met since it's checked first
		expect(result.alert?.reason.type).toBe("price_target_met");
	});
});
