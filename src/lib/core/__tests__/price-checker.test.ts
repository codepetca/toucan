import type { FlightOffer } from "@/lib/providers/types";
import { describe, expect, it } from "vitest";
import {
	type PriceHistory,
	type RouteConfig,
	checkRoute,
	computeRecentAverage,
} from "../price-checker";

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

// Helper to create history entries relative to `now`
function makeHistory(prices: number[], hoursAgoStart = 0): PriceHistory {
	const entries = prices.map((price, i) => ({
		price,
		checkedAt: new Date(
			now.getTime() - (hoursAgoStart + i * 6) * 60 * 60 * 1000,
		),
	}));
	return {
		entries,
		allTimeLow: prices.length > 0 ? Math.min(...prices) : null,
	};
}

const smartRoute: RouteConfig = {
	priceTarget: null,
	priceDropDelta: null,
	currency: "CAD",
};

describe("smart alerts", () => {
	it("does not fire when history is undefined", () => {
		const offers = [makeOffer({ totalAmount: 100 })];
		const result = checkRoute(smartRoute, offers, 200, null, 12, now);
		expect(result.alert).toBeNull();
	});

	it("does not fire when insufficient history (<4 entries)", () => {
		const history = makeHistory([200, 210, 220]); // only 3
		const offers = [makeOffer({ totalAmount: 100 })];
		const result = checkRoute(smartRoute, offers, 200, null, 12, now, history);
		expect(result.alert).toBeNull();
	});

	it("fires all_time_low when price < all previous prices", () => {
		const history = makeHistory([200, 210, 220, 230]);
		const offers = [makeOffer({ totalAmount: 190 })];
		const result = checkRoute(smartRoute, offers, 200, null, 12, now, history);
		expect(result.alert).not.toBeNull();
		expect(result.alert?.reason.type).toBe("all_time_low");
		if (result.alert?.reason.type === "all_time_low") {
			expect(result.alert.reason.previousLow).toBe(200);
			expect(result.alert.reason.newLow).toBe(190);
		}
	});

	it("does NOT fire all_time_low when price equals existing low", () => {
		const history = makeHistory([200, 210, 220, 230]);
		const offers = [makeOffer({ totalAmount: 200 })];
		const result = checkRoute(smartRoute, offers, 200, null, 12, now, history);
		// 200 is not strictly less than allTimeLow of 200
		expect(result.alert).toBeNull();
	});

	it("fires below_recent_average at >15% below", () => {
		// Average = 300, 15% below = 255. Price 250 is > 16% below.
		// Set allTimeLow to 250 so all_time_low doesn't fire (price must be strictly less)
		const history: PriceHistory = {
			entries: [300, 300, 300, 300].map((price, i) => ({
				price,
				checkedAt: new Date(now.getTime() - i * 6 * 60 * 60 * 1000),
			})),
			allTimeLow: 250,
		};
		const offers = [makeOffer({ totalAmount: 250 })];
		const result = checkRoute(smartRoute, offers, 250, null, 12, now, history);
		expect(result.alert).not.toBeNull();
		expect(result.alert?.reason.type).toBe("below_recent_average");
		if (result.alert?.reason.type === "below_recent_average") {
			expect(result.alert.reason.average).toBe(300);
			expect(result.alert.reason.price).toBe(250);
			expect(result.alert.reason.percentBelow).toBeCloseTo(1 / 6);
		}
	});

	it("does NOT fire below_recent_average at <15% below", () => {
		// Average = 300, 15% below = 255. Price 260 is only ~13% below.
		// Set allTimeLow to 260 so all_time_low doesn't fire either
		const history: PriceHistory = {
			entries: [300, 300, 300, 300].map((price, i) => ({
				price,
				checkedAt: new Date(now.getTime() - i * 6 * 60 * 60 * 1000),
			})),
			allTimeLow: 260,
		};
		const offers = [makeOffer({ totalAmount: 260 })];
		const result = checkRoute(smartRoute, offers, 260, null, 12, now, history);
		expect(result.alert).toBeNull();
	});

	it("ignores entries older than 7 days for average", () => {
		// 4 entries from 8+ days ago, only 3 recent → insufficient for average
		const oldEntries = [300, 310, 320, 330].map((price, i) => ({
			price,
			checkedAt: new Date(now.getTime() - (8 * 24 + i * 6) * 60 * 60 * 1000),
		}));
		const recentEntries = [300, 310, 320].map((price, i) => ({
			price,
			checkedAt: new Date(now.getTime() - i * 6 * 60 * 60 * 1000),
		}));
		const history: PriceHistory = {
			entries: [...recentEntries, ...oldEntries],
			allTimeLow: 300,
		};
		const offers = [makeOffer({ totalAmount: 250 })];
		const result = checkRoute(smartRoute, offers, 250, null, 12, now, history);
		// 250 < 300 allTimeLow → all_time_low fires
		expect(result.alert?.reason.type).toBe("all_time_low");
	});

	it("manual threshold takes priority over smart alerts", () => {
		const route: RouteConfig = {
			priceTarget: 200,
			priceDropDelta: null,
			currency: "CAD",
		};
		const history = makeHistory([300, 310, 320, 330]);
		const offers = [makeOffer({ totalAmount: 190 })];
		const result = checkRoute(route, offers, 300, null, 12, now, history);
		// price_target_met (190 <= 200) should fire, not all_time_low
		expect(result.alert?.reason.type).toBe("price_target_met");
	});

	it("all_time_low takes priority over below_recent_average", () => {
		// Both would qualify: price < allTimeLow AND price < avg * 0.85
		const history = makeHistory([300, 310, 320, 330]);
		const offers = [makeOffer({ totalAmount: 250 })];
		// allTimeLow = 300, price 250 < 300 → all_time_low
		// average ≈ 315, 250/315 ≈ 20.6% below → also qualifies for below_recent_average
		const result = checkRoute(smartRoute, offers, 300, null, 12, now, history);
		expect(result.alert?.reason.type).toBe("all_time_low");
	});

	it("cooldown is bypassed for all_time_low smart alert", () => {
		const history = makeHistory([300, 310, 320, 330]);
		const offers = [makeOffer({ totalAmount: 250 })];
		const lastAlerted = new Date("2025-06-01T06:00:00Z"); // 6 hours ago
		// lastBestPrice 300, currentPrice 250 < 300 → new all-time low → bypass cooldown
		const result = checkRoute(
			smartRoute,
			offers,
			300,
			lastAlerted,
			12,
			now,
			history,
		);
		expect(result.alert).not.toBeNull();
		expect(result.alert?.reason.type).toBe("all_time_low");
	});
});

describe("computeRecentAverage", () => {
	it("returns null when fewer than MIN_HISTORY_ENTRIES in window", () => {
		const entries = [200, 210, 220].map((price, i) => ({
			price,
			checkedAt: new Date(now.getTime() - i * 6 * 60 * 60 * 1000),
		}));
		expect(computeRecentAverage(entries, now, 7)).toBeNull();
	});

	it("computes average of recent entries only", () => {
		const recent = [200, 300, 400, 500].map((price, i) => ({
			price,
			checkedAt: new Date(now.getTime() - i * 6 * 60 * 60 * 1000),
		}));
		const old = [
			{
				price: 1000,
				checkedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
			},
		];
		const avg = computeRecentAverage([...recent, ...old], now, 7);
		expect(avg).toBe(350); // (200+300+400+500)/4
	});
});
