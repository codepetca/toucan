import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { hashPassword } from "../src/lib/crypto";
import { users } from "../src/lib/db/schema";

async function seed() {
	const email = process.env.SEED_USER_EMAIL;
	const password = process.env.SEED_USER_PASSWORD;
	const connectionString = process.env.POSTGRES_URL;

	if (!email || !password) {
		console.error(
			"SEED_USER_EMAIL and SEED_USER_PASSWORD environment variables are required",
		);
		process.exit(1);
	}

	if (!connectionString) {
		console.error("POSTGRES_URL environment variable is required");
		process.exit(1);
	}

	const pool = new Pool({ connectionString });
	const db = drizzle(pool);

	const passwordHash = await hashPassword(password);

	await db.insert(users).values({ email, passwordHash }).onConflictDoUpdate({
		target: users.email,
		set: { passwordHash },
	});

	console.log(`Seeded user: ${email}`);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
