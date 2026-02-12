import {
	boolean,
	char,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const routes = pgTable("routes", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	origin: char("origin", { length: 3 }).notNull(),
	destination: char("destination", { length: 3 }).notNull(),
	outboundDate: text("outbound_date").notNull(), // YYYY-MM-DD
	returnDate: text("return_date"), // nullable, YYYY-MM-DD
	cabinClass: text("cabin_class").notNull().default("economy"),
	priceTarget: numeric("price_target"), // nullable
	priceDropDelta: numeric("price_drop_delta"), // nullable
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const priceChecks = pgTable("price_checks", {
	id: uuid("id").defaultRandom().primaryKey(),
	routeId: uuid("route_id")
		.notNull()
		.references(() => routes.id),
	checkedAt: timestamp("checked_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	bestPrice: numeric("best_price").notNull(),
	currency: char("currency", { length: 3 }).notNull(),
	airline: text("airline").notNull(),
	offerCount: integer("offer_count").notNull(),
	bestOffer: jsonb("best_offer"),
});

export const alerts = pgTable("alerts", {
	id: uuid("id").defaultRandom().primaryKey(),
	routeId: uuid("route_id")
		.notNull()
		.references(() => routes.id),
	alertedAt: timestamp("alerted_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	reasonType: text("reason_type").notNull(), // 'price_target_met' | 'price_drop'
	price: numeric("price").notNull(),
	previousBest: numeric("previous_best"),
	offerSummary: jsonb("offer_summary"),
});
