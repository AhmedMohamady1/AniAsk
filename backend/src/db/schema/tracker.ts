import {
    pgTable,
    text,
    uuid,
    timestamp,
    unique,
    integer,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { pgEnum } from "drizzle-orm/pg-core";
import { TRACKING_STATUSES } from "../../types/tracking.types";

export const trackingStatus = pgEnum("tracking_status", TRACKING_STATUSES);

export const trackingTable = pgTable(
    "tracking",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .references(() => usersTable.userId, {
                onDelete: "cascade",
            })
            .notNull(),
        animeId: integer("anime_id").notNull(),
        status: trackingStatus("status").notNull(),
        ratings: integer("ratings"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        unique("tracking_user_anime_unique").on(table.userId, table.animeId),
    ],
);
