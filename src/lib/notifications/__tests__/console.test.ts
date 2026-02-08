import { describe, expect, it, vi } from "vitest";
import { ConsoleNotificationChannel } from "../console";
import type { AlertPayload } from "../types";

const baseOffer = {
	id: "off_1",
	totalAmount: 170,
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
};

describe("ConsoleNotificationChannel", () => {
	it("formats price_target_met alert correctly", async () => {
		const spy = vi.spyOn(console, "log").mockImplementation(() => {});
		const channel = new ConsoleNotificationChannel();

		const payload: AlertPayload = {
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2025-06-15",
			reason: {
				type: "price_target_met",
				target: 180,
				actual: 170,
			},
			offer: baseOffer,
		};

		await channel.send(payload);

		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining("below target of $180"),
		);
		expect(spy).toHaveBeenCalledWith(expect.stringContaining("$170"));
		spy.mockRestore();
	});

	it("formats price_drop alert correctly", async () => {
		const spy = vi.spyOn(console, "log").mockImplementation(() => {});
		const channel = new ConsoleNotificationChannel();

		const payload: AlertPayload = {
			origin: "YYZ",
			destination: "YHZ",
			outboundDate: "2025-06-15",
			returnDate: "2025-06-20",
			reason: {
				type: "price_drop",
				previousBest: 250,
				newPrice: 200,
				delta: 50,
			},
			offer: { ...baseOffer, totalAmount: 200 },
		};

		await channel.send(payload);

		expect(spy).toHaveBeenCalledWith(expect.stringContaining("dropped $50"));
		expect(spy).toHaveBeenCalledWith(expect.stringContaining("from $250"));
		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining("2025-06-15 – 2025-06-20"),
		);
		spy.mockRestore();
	});
});
