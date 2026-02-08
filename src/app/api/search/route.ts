import { requireAuth } from "@/lib/auth";
import { createDuffelProvider } from "@/lib/providers/duffel";
import { NextResponse } from "next/server";
import { z } from "zod";

const searchSchema = z.object({
	origin: z.string().length(3).toUpperCase(),
	destination: z.string().length(3).toUpperCase(),
	outboundDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	returnDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	cabinClass: z
		.enum(["economy", "premium_economy", "business", "first"])
		.default("economy"),
});

export async function POST(request: Request) {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const parsed = searchSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid input", details: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const token = process.env.DUFFEL_API_TOKEN;
	if (!token) {
		return NextResponse.json(
			{ error: "Duffel API not configured" },
			{ status: 500 },
		);
	}

	const provider = createDuffelProvider(token);
	const data = parsed.data;

	try {
		const offers = await provider.searchOffers({
			origin: data.origin,
			destination: data.destination,
			outboundDate: data.outboundDate,
			returnDate: data.returnDate,
			cabinClass: data.cabinClass,
		});

		return NextResponse.json({ offers });
	} catch (err) {
		console.error("Duffel search failed:", err);
		return NextResponse.json(
			{ error: "Flight search failed" },
			{ status: 502 },
		);
	}
}
