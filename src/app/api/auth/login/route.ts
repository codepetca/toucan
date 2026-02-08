import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export async function POST(request: Request) {
	const body = await request.json();
	const parsed = loginSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	}

	const { email, password } = parsed.data;

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
	}

	await createSession(user.id, user.email);

	return NextResponse.json({ ok: true });
}
