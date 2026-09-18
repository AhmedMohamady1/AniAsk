import {
    pgTable,
    varchar,
    uuid,
    timestamp,
    text,
    boolean,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    userId: uuid("user_id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 50 }).unique().notNull(),
    email: varchar("email", { length: 50 }).unique().notNull(),
    password: text("password").notNull(),
    firstName: varchar("first_name", { length: 30 }).notNull(),
    lastName: varchar("last_name", { length: 30 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
});

export const refreshTokenTable = pgTable("refresh_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .references(() => usersTable.userId, {
            onDelete: "cascade",
        })
        .notNull(),
    token: text("token").notNull().unique(),
    revoked: boolean("revoked").default(false).notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
