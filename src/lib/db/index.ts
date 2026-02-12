import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

function createDb() {
	const connectionString = process.env.POSTGRES_URL;
	if (!connectionString) {
		throw new Error("POSTGRES_URL environment variable is required");
	}
	const pool = new Pool({ connectionString });
	return drizzle(pool, { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
	get(_target, prop, receiver) {
		if (!_db) {
			_db = createDb();
		}
		return Reflect.get(_db, prop, receiver);
	},
});
