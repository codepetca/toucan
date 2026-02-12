import { routes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";

type DeactivateResult =
	| { success: true }
	| { success: false; error: "not_found" };

export async function deactivateRoute(
	db: NeonDatabase<Record<string, unknown>>,
	routeId: string,
	userId: string,
): Promise<DeactivateResult> {
	const result = await db
		.update(routes)
		.set({ isActive: false })
		.where(
			and(
				eq(routes.id, routeId),
				eq(routes.userId, userId),
				eq(routes.isActive, true),
			),
		)
		.returning({ id: routes.id });

	if (result.length === 0) {
		return { success: false, error: "not_found" };
	}

	return { success: true };
}
