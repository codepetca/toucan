import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await getSession();

	if (!session.userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.json({ userId: session.userId, email: session.email });
}
