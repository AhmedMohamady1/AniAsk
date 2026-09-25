import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const emailVerificationTable = pgTable("email_verifications", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
        .references(() => usersTable.userId, {
            onDelete: "cascade",
        })
        .notNull(),

    otpHash: text("otp_hash").notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    attempts: integer("attempts").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});
