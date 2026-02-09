import { requireAuth } from "@/lib/auth";
import { createDuffelProvider } from "@/lib/providers/duffel";
import { NextResponse } from "next/server";
import { z } from "zod";

const iataList = z.string().regex(/^[A-Z]{3}(,[A-Z]{3})*$/i).transform((s) => s.toUpperCase());

const searchSchema = z.object({
	origin: iataList,
	destination: iataList,
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

	const origins = data.origin.split(",");
	const destinations = data.destination.split(",");

	// Build all origin/destination pairs
	const pairs: { origin: string; destination: string }[] = [];
	for (const o of origins) {
		for (const d of destinations) {
			if (o !== d) pairs.push({ origin: o, destination: d });
		}
	}

	try {
		// Search all pairs in parallel
		const results = await Promise.all(
			pairs.map((pair) =>
				provider
					.searchOffers({
						origin: pair.origin,
						destination: pair.destination,
						outboundDate: data.outboundDate,
						returnDate: data.returnDate,
						cabinClass: data.cabinClass,
					})
					.catch((err) => {
						console.error(`Search failed for ${pair.origin}->${pair.destination}:`, err);
						return [];
					})
			)
		);

		// Merge and deduplicate by offer ID
		const seen = new Set<string>();
		const offers = results.flat().filter((offer) => {
			if (seen.has(offer.id)) return false;
			seen.add(offer.id);
			return true;
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
