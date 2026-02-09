import type { SessionData } from "@/types";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

function getSessionSecret(): string {
	const secret = process.env.SESSION_SECRET;
	if (!secret) {
		throw new Error("SESSION_SECRET environment variable is required");
	}
	return secret;
}

const sessionOptions = {
	get password() {
		return getSessionSecret();
	},
	cookieName: "toucan_session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		sameSite: "lax" as const,
	},
};

export async function getSession() {
	const cookieStore = await cookies();
	return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function createSession(userId: string, email: string) {
	const session = await getSession();
	session.userId = userId;
	session.email = email;
	await session.save();
}

export async function destroySession() {
	const session = await getSession();
	session.destroy();
}

export async function requireAuth(): Promise<SessionData> {
	const session = await getSession();
	if (!session.userId) {
		throw new Error("Unauthorized");
	}
	return { userId: session.userId, email: session.email };
}
