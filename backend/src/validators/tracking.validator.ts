import { z } from "zod";
import { TRACKING_STATUSES } from "../types/tracking.types";

export const trackingSchema = z.object({
    params: z.object({}).default({}),

    query: z.object({}).default({}),

    body: z.object({
        animeId: z.coerce
            .number()
            .int()
            .positive("Anime ID must be a positive number"),
        status: z.enum(TRACKING_STATUSES),
        ratings: z.coerce
            .number()
            .int()
            .min(0, "Ratings must be a non-negative number")
            .max(100, "Ratings must be a number between 0 and 100")
            .optional(),
        reviews: z.string().optional(),
    }),
});

export const getTrackingSchema = z.object({
    params: z.object({}).default({}),

    query: z.object({
        status: z.enum(TRACKING_STATUSES).optional(),

        page: z.coerce.number().int().min(1).default(1),

        perPage: z.coerce.number().int().min(1).max(50).default(50),
    }),

    body: z.object({}).default({}),
});

export const updateTrackingSchema = z.object({
    params: z.object({
        animeId: z.coerce
            .number()
            .int()
            .positive("Anime ID must be a positive number"),
    }),

    query: z.object({}).default({}),

    body: z
        .object({
            status: z.enum(TRACKING_STATUSES).optional(),

            ratings: z.coerce
                .number()
                .int()
                .min(0, "Ratings must be a non-negative number")
                .max(100, "Ratings must be a number between 0 and 100")
                .optional(),
            reviews: z.string().optional(),
        })
        .refine(
            (data) => data.status !== undefined || data.ratings !== undefined,
            {
                message: "At least one field must be provided",
            },
        ),
});

export const deleteTrackingSchema = z.object({
    params: z.object({
        animeId: z.coerce
            .number()
            .int()
            .positive("Anime ID must be a positive number"),
    }),

    query: z.object({}).default({}),

    body: z.object({}).default({}),
});

// export type TrackingStatus = z.infer<typeof trackingSchema>["body"]["status"];
