import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { priceChecks, routes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const iataCode = z.string().length(3).toUpperCase();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createRouteSchema = z
	.object({
		origin: iataCode,
		destination: iataCode,
		outboundDate: dateString,
		returnDate: dateString.optional(),
		cabinClass: z
			.enum(["economy", "premium_economy", "business", "first"])
			.default("economy"),
		priceTarget: z.number().positive().optional(),
		priceDropDelta: z.number().positive().optional(),
	})
	.refine((data) => data.priceTarget || data.priceDropDelta, {
		message: "At least one of priceTarget or priceDropDelta must be set",
	});

export async function GET() {
	try {
		const session = await requireAuth();

		const userRoutes = await db
			.select()
			.from(routes)
			.where(eq(routes.userId, session.userId))
			.orderBy(desc(routes.createdAt));

		// Get latest price check for each route
		const routesWithPrices = await Promise.all(
			userRoutes.map(async (route) => {
				const [latestCheck] = await db
					.select()
					.from(priceChecks)
					.where(eq(priceChecks.routeId, route.id))
					.orderBy(desc(priceChecks.checkedAt))
					.limit(1);

				return { ...route, latestPriceCheck: latestCheck ?? null };
			}),
		);

		return NextResponse.json(routesWithPrices);
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
}

export async function POST(request: Request) {
	try {
		const session = await requireAuth();
		const body = await request.json();
		const parsed = createRouteSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid input", details: parsed.error.flatten() },
				{ status: 400 },
			);
		}

		const data = parsed.data;

		const [route] = await db
			.insert(routes)
			.values({
				userId: session.userId,
				origin: data.origin,
				destination: data.destination,
				outboundDate: data.outboundDate,
				returnDate: data.returnDate ?? null,
				cabinClass: data.cabinClass,
				priceTarget: data.priceTarget?.toString() ?? null,
				priceDropDelta: data.priceDropDelta?.toString() ?? null,
			})
			.returning();

		return NextResponse.json(route, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
}
