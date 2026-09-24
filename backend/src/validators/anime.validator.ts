import { z } from "zod";

export const paginationSchema = z.object({
    body: z.object({}).default({}),

    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        perPage: z.coerce.number().int().min(1).max(50).default(10),
    }),

    params: z.object({}).default({}),
});

export const searchAnimeSchema = z.object({
    body: z.object({}).default({}),

    query: z.object({
        q: z
            .string()
            .trim()
            .min(1, "Search query is required")
            .max(100, "Search query is too long"),

        page: z.coerce.number().int().min(1).default(1),

        perPage: z.coerce.number().int().min(1).max(50).default(10),
    }),

    params: z.object({}).default({}),
});

export const animeIdSchema = z.object({
    body: z.object({}).default({}),

    query: z.object({}).default({}),

    params: z.object({
        id: z.coerce
            .number()
            .int()
            .positive("Anime ID must be a positive number"),
    }),
});
