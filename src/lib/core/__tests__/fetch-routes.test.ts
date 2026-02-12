import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRoutes } from "../fetch-routes";

describe("fetchRoutes", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("calls fetch with /api/routes and no extra options", async () => {
		const mockRoutes = [{ id: "1" }];
		const spy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify(mockRoutes)));

		await fetchRoutes();
		expect(spy).toHaveBeenCalledWith("/api/routes");
	});

	it("returns routes on success", async () => {
		const mockRoutes = [{ id: "1", origin: "YYZ", destination: "YHZ" }];
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify(mockRoutes)),
		);

		const result = await fetchRoutes();
		expect(result).toEqual({ routes: mockRoutes, error: null });
	});

	it("returns auth error on non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Unauthorized", { status: 401 }),
		);

		const result = await fetchRoutes();
		expect(result).toEqual({ routes: null, error: "auth" });
	});

	it("returns network error when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

		const result = await fetchRoutes();
		expect(result).toEqual({ routes: null, error: "network" });
	});

	it("returns network error when response is not valid JSON", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("<html>login page</html>"),
		);

		const result = await fetchRoutes();
		// HTML parses as valid JSON? No — "<html>" is not valid JSON, so .json() throws
		expect(result).toEqual({ routes: null, error: "network" });
	});
});
