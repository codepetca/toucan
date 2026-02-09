import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { priceChecks, routes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const iataList = z.string().regex(/^[A-Z]{3}(,[A-Z]{3})*$/i).transform((s) => s.toUpperCase());
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createRouteSchema = z
	.object({
		origin: iataList,
		destination: iataList,
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

		const origins = data.origin.split(",");
		const destinations = data.destination.split(",");

		// Create one route per origin/destination pair
		const pairs: { origin: string; destination: string }[] = [];
		for (const o of origins) {
			for (const d of destinations) {
				if (o !== d) pairs.push({ origin: o, destination: d });
			}
		}

		const created = await db
			.insert(routes)
			.values(
				pairs.map((pair) => ({
					userId: session.userId,
					origin: pair.origin,
					destination: pair.destination,
					outboundDate: data.outboundDate,
					returnDate: data.returnDate ?? null,
					cabinClass: data.cabinClass,
					priceTarget: data.priceTarget?.toString() ?? null,
					priceDropDelta: data.priceDropDelta?.toString() ?? null,
				}))
			)
			.returning();

		return NextResponse.json(created.length === 1 ? created[0] : created, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
}
