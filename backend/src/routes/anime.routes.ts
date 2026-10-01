import { Router } from "express";
import {
    trendingAnime,
    popularAnime,
    topRatedAnime,
    airingAnime,
    searchAnimeController,
    animeDetails,
} from "../controllers/anime.controller";
import { validate } from "../middlewares/validation.middleware";
import {
    paginationSchema,
    searchAnimeSchema,
    animeIdSchema,
} from "../validators/anime.validator";

const router = Router();

/**
 * @swagger
 * /anime/trending:
 *   get:
 *     summary: Get trending anime
 *     tags:
 *       - Anime
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *
 *     responses:
 *       200:
 *         description: Trending anime retrieved successfully
 *
 *       400:
 *         description: Invalid pagination parameters
 */
router.get("/trending", validate(paginationSchema), trendingAnime);

/**
 * @swagger
 * /anime/popular:
 *   get:
 *     summary: Get popular anime
 *     tags:
 *       - Anime
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *
 *     responses:
 *       200:
 *         description: Popular anime retrieved successfully
 *
 *       400:
 *         description: Invalid pagination parameters
 */
router.get("/popular", validate(paginationSchema), popularAnime);

/**
 * @swagger
 * /anime/top-rated:
 *   get:
 *     summary: Get top-rated anime
 *     tags:
 *       - Anime
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *
 *     responses:
 *       200:
 *         description: Top-rated anime retrieved successfully
 *
 *       400:
 *         description: Invalid pagination parameters
 */
router.get("/top-rated", validate(paginationSchema), topRatedAnime);

/**
 * @swagger
 * /anime/airing:
 *   get:
 *     summary: Get airing anime
 *     tags:
 *       - Anime
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *
 *     responses:
 *       200:
 *         description: Airing anime retrieved successfully
 *
 *       400:
 *         description: Invalid pagination parameters
 */
router.get("/airing", validate(paginationSchema), airingAnime);

/**
 * @swagger
 * /anime/search:
 *   get:
 *     summary: Search anime
 *     tags:
 *       - Anime
 *
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         description: Anime search query
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: Naruto
 *
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *
 *       400:
 *         description: Invalid search parameters
 */
router.get("/search", validate(searchAnimeSchema), searchAnimeController);

/**
 * @swagger
 * /anime/{id}:
 *   get:
 *     summary: Get anime details
 *     tags:
 *       - Anime
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Anime ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1535
 *
 *     responses:
 *       200:
 *         description: Anime details retrieved successfully
 *
 *       400:
 *         description: Invalid anime ID
 *
 *       404:
 *         description: Anime not found
 */
router.get("/:id", validate(animeIdSchema), animeDetails);

export default router;
