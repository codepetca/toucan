import { requireAuth } from "@/lib/auth";
import { deactivateRoute } from "@/lib/core/deactivate-route";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await requireAuth();
		const { id } = await params;

		if (!UUID_RE.test(id)) {
			return NextResponse.json({ error: "Invalid route ID" }, { status: 400 });
		}

		const result = await deactivateRoute(db, id, session.userId);

		if (!result.success) {
			return NextResponse.json({ error: "Route not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
}
