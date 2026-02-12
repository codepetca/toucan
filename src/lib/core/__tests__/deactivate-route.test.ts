import { describe, expect, it, vi } from "vitest";
import { deactivateRoute } from "../deactivate-route";

function makeMockDb(rowsAffected: number) {
	const mockResult = { rowsAffected };
	const mockReturning = vi
		.fn()
		.mockResolvedValue(
			rowsAffected > 0 ? [{ id: "route-1", isActive: false }] : [],
		);
	const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
	const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
	const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

	return {
		db: { update: mockUpdate } as unknown,
		mocks: { mockUpdate, mockSet, mockWhere, mockReturning },
	};
}

describe("deactivateRoute", () => {
	it("returns success when route exists and belongs to user", async () => {
		const { db } = makeMockDb(1);
		const result = await deactivateRoute(
			db as Parameters<typeof deactivateRoute>[0],
			"route-1",
			"user-1",
		);
		expect(result).toEqual({ success: true });
	});

	it("returns not_found when no matching route", async () => {
		const { db } = makeMockDb(0);
		const result = await deactivateRoute(
			db as Parameters<typeof deactivateRoute>[0],
			"route-1",
			"user-1",
		);
		expect(result).toEqual({ success: false, error: "not_found" });
	});
});
