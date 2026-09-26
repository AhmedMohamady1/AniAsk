import { trackingTable } from "../db/schema";
import { db } from "../db";
import { and, count, eq, desc } from "drizzle-orm";
// import { TrackingStatus } from "../validators/tracking.validator";
import { TrackingStatus } from "../types/tracking.types";
import CustomError from "../errors/custom.errors";

export async function createTrackingEntry(
    userId: string,
    animeId: number,
    status: TrackingStatus,
    ratings?: number,
    reviews?: string,
) {
    const existingTracking = await db
        .select({
            id: trackingTable.id,
        })
        .from(trackingTable)
        .where(
            and(
                eq(trackingTable.userId, userId),
                eq(trackingTable.animeId, animeId),
            ),
        )
        .limit(1);

    if (existingTracking.length > 0) {
        throw new CustomError(
            "Tracking entry already exists for this anime",
            409,
        );
    }

    const data = await db
        .insert(trackingTable)
        .values({
            userId,
            animeId,
            status,
            ratings: ratings ?? null,
            reviews: reviews ?? null,
        })
        .returning();
    return data;
}

export async function getUserTracking(
    userId: string,
    page: number,
    perPage: number,
    status?: TrackingStatus,
) {
    const offset = (page - 1) * perPage;

    const conditions = status
        ? and(
              eq(trackingTable.userId, userId),
              eq(trackingTable.status, status),
          )
        : eq(trackingTable.userId, userId);

    const data = await db
        .select({
            id: trackingTable.id,
            animeId: trackingTable.animeId,
            status: trackingTable.status,
            ratings: trackingTable.ratings,
            reviews: trackingTable.reviews,
            createdAt: trackingTable.createdAt,
            updatedAt: trackingTable.updatedAt,
        })
        .from(trackingTable)
        .where(conditions)
        .orderBy(desc(trackingTable.createdAt))
        .limit(perPage)
        .offset(offset);

    const [{ total }] = await db
        .select({ total: count() })
        .from(trackingTable)
        .where(conditions);

    return { data, total };
}

export async function updateTrackingEntry(
    userId: string,
    animeId: number,
    data: {
        status?: TrackingStatus;
        ratings?: number;
        reviews?: string;
    },
) {
    const [updatedTracking] = await db
        .update(trackingTable)
        .set({
            ...data,
        })
        .where(
            and(
                eq(trackingTable.userId, userId),
                eq(trackingTable.animeId, animeId),
            ),
        )
        .returning();
    if (!updatedTracking) {
        throw new CustomError("Tracking entry not found", 404);
    }

    return updatedTracking;
}

export async function deleteTrackingEntry(userId: string, animeId: number) {
    const [deletedTracking] = await db
        .delete(trackingTable)
        .where(
            and(
                eq(trackingTable.userId, userId),
                eq(trackingTable.animeId, animeId),
            ),
        )
        .returning();

    if (!deletedTracking) {
        throw new CustomError("Tracking entry not found", 404);
    }

    return deletedTracking;
}
