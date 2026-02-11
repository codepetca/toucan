import { describe, expect, it, vi } from "vitest";

const mockRequireAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ requireAuth: () => mockRequireAuth() }));

const mockDeactivateRoute = vi.fn();
vi.mock("@/lib/core/deactivate-route", () => ({
	deactivateRoute: (...args: unknown[]) => mockDeactivateRoute(...args),
}));

vi.mock("@/lib/db", () => ({ db: {} }));

// Import after mocks are set up
const { DELETE } = await import("../route");

describe("DELETE /api/routes/[id]", () => {
	it("returns 400 for invalid (non-UUID) route ID", async () => {
		mockRequireAuth.mockResolvedValue({ userId: "user-1", email: "a@b.com" });

		const request = new Request("http://localhost/api/routes/not-a-uuid", {
			method: "DELETE",
		});
		const response = await DELETE(request, {
			params: Promise.resolve({ id: "not-a-uuid" }),
		});

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Invalid route ID");
	});

	it("calls deactivateRoute with correct route ID and user ID", async () => {
		const routeId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
		mockRequireAuth.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
		mockDeactivateRoute.mockResolvedValue({ success: true });

		const request = new Request(`http://localhost/api/routes/${routeId}`, {
			method: "DELETE",
		});
		const response = await DELETE(request, {
			params: Promise.resolve({ id: routeId }),
		});

		expect(response.status).toBe(200);
		expect(mockDeactivateRoute).toHaveBeenCalledWith(
			expect.anything(),
			routeId,
			"user-1",
		);
	});

	it("returns 404 when route not found", async () => {
		const routeId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
		mockRequireAuth.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
		mockDeactivateRoute.mockResolvedValue({
			success: false,
			error: "not_found",
		});

		const request = new Request(`http://localhost/api/routes/${routeId}`, {
			method: "DELETE",
		});
		const response = await DELETE(request, {
			params: Promise.resolve({ id: routeId }),
		});

		expect(response.status).toBe(404);
	});

	it("returns 401 when not authenticated", async () => {
		mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

		const request = new Request("http://localhost/api/routes/some-id", {
			method: "DELETE",
		});
		const response = await DELETE(request, {
			params: Promise.resolve({ id: "some-id" }),
		});

		expect(response.status).toBe(401);
	});
});
