import type { AlertReason } from "@/lib/notifications/types";
import type { FlightOffer } from "@/lib/providers/types";

export const MIN_HISTORY_ENTRIES = 4;
export const RECENT_WINDOW_DAYS = 7;
export const SIGNIFICANT_DROP_PERCENT = 0.15;

export interface PriceHistoryEntry {
	price: number;
	checkedAt: Date;
}

export interface PriceHistory {
	entries: PriceHistoryEntry[];
	allTimeLow: number | null;
}

export interface RouteConfig {
	priceTarget: number | null;
	priceDropDelta: number | null;
	currency: string;
}

export interface CheckResult {
	newBestPrice: number | null;
	bestOffer: FlightOffer | null;
	alert: { reason: AlertReason; offer: FlightOffer } | null;
}

export function computeRecentAverage(
	entries: PriceHistoryEntry[],
	now: Date,
	windowDays: number,
): number | null {
	const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
	const recent = entries.filter((e) => e.checkedAt >= cutoff);
	if (recent.length < MIN_HISTORY_ENTRIES) return null;
	return recent.reduce((sum, e) => sum + e.price, 0) / recent.length;
}

export function checkRoute(
	route: RouteConfig,
	offers: FlightOffer[],
	lastBestPrice: number | null,
	lastAlertedAt: Date | null,
	cooldownHours: number,
	now: Date,
	priceHistory?: PriceHistory,
): CheckResult {
	// Filter to matching currency only
	const filtered = offers.filter((o) => o.currency === route.currency);

	if (filtered.length === 0) {
		return { newBestPrice: lastBestPrice, bestOffer: null, alert: null };
	}

	// Find cheapest offer
	const sorted = [...filtered].sort((a, b) => a.totalAmount - b.totalAmount);
	const cheapest = sorted[0];
	const currentPrice = cheapest.totalAmount;

	// Determine new best price
	const newBestPrice =
		lastBestPrice === null
			? currentPrice
			: Math.min(lastBestPrice, currentPrice);

	// Check if alert should fire
	let alertReason: AlertReason | null = null;

	// Rule: price <= target
	if (route.priceTarget !== null && currentPrice <= route.priceTarget) {
		alertReason = {
			type: "price_target_met",
			target: route.priceTarget,
			actual: currentPrice,
		};
	}

	// Rule: price drop >= delta from last best
	if (
		alertReason === null &&
		route.priceDropDelta !== null &&
		lastBestPrice !== null &&
		lastBestPrice - currentPrice >= route.priceDropDelta
	) {
		alertReason = {
			type: "price_drop",
			previousBest: lastBestPrice,
			newPrice: currentPrice,
			delta: lastBestPrice - currentPrice,
		};
	}

	// Smart: all-time low
	if (
		alertReason === null &&
		priceHistory &&
		priceHistory.entries.length >= MIN_HISTORY_ENTRIES &&
		priceHistory.allTimeLow !== null &&
		currentPrice < priceHistory.allTimeLow
	) {
		alertReason = {
			type: "all_time_low",
			previousLow: priceHistory.allTimeLow,
			newLow: currentPrice,
		};
	}

	// Smart: below recent average
	if (alertReason === null && priceHistory) {
		const avg = computeRecentAverage(
			priceHistory.entries,
			now,
			RECENT_WINDOW_DAYS,
		);
		if (avg !== null) {
			const percentBelow = (avg - currentPrice) / avg;
			if (percentBelow > SIGNIFICANT_DROP_PERCENT) {
				alertReason = {
					type: "below_recent_average",
					average: avg,
					price: currentPrice,
					percentBelow,
				};
			}
		}
	}

	if (alertReason === null) {
		return { newBestPrice, bestOffer: cheapest, alert: null };
	}

	// Apply cooldown — suppress if within cooldown period, unless it's a new all-time low
	if (lastAlertedAt !== null) {
		const hoursSinceLastAlert =
			(now.getTime() - lastAlertedAt.getTime()) / (1000 * 60 * 60);
		const isNewAllTimeLow =
			lastBestPrice === null || currentPrice < lastBestPrice;

		if (hoursSinceLastAlert < cooldownHours && !isNewAllTimeLow) {
			return { newBestPrice, bestOffer: cheapest, alert: null };
		}
	}

	return {
		newBestPrice,
		bestOffer: cheapest,
		alert: { reason: alertReason, offer: cheapest },
	};
}
