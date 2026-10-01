import { Router } from "express";
import {
    createTracking,
    getTracking,
    updateTracking,
    deleteTracking,
    getAllUsersReviews,
    getAverageRating,
} from "../controllers/tracking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
    getTrackingSchema,
    trackingSchema,
    updateTrackingSchema,
    deleteTrackingSchema,
    animeTrackingParamSchema,
} from "../validators/tracking.validator";

const router = Router();

/**
 * @swagger
 * /tracking:
 *   post:
 *     summary: Add anime to tracking
 *     tags:
 *       - Tracking
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tracking'
 *
 *     responses:
 *       201:
 *         description: Anime tracking created successfully
 *
 *       400:
 *         description: Invalid tracking data
 *
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, validate(trackingSchema), createTracking);

/**
 * @swagger
 * /tracking:
 *   get:
 *     summary: Get current user's tracked anime
 *     tags:
 *       - Tracking
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter tracking by status
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 50
 *
 *     responses:
 *       200:
 *         description: User tracking retrieved successfully
 *
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, validate(getTrackingSchema), getTracking);

/**
 * @swagger
 * /tracking/{animeId}:
 *   patch:
 *     summary: Update anime tracking
 *     tags:
 *       - Tracking
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: animeId
 *         required: true
 *         description: Anime ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1535
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTracking'
 *
 *     responses:
 *       200:
 *         description: Tracking updated successfully
 *
 *       400:
 *         description: Invalid tracking data
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Tracking entry not found
 */
router.patch(
    "/:animeId",
    authMiddleware,
    validate(updateTrackingSchema),
    updateTracking,
);

/**
 * @swagger
 * /tracking/{animeId}:
 *   delete:
 *     summary: Delete anime from tracking
 *     tags:
 *       - Tracking
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: animeId
 *         required: true
 *         description: Anime ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1535
 *
 *     responses:
 *       200:
 *         description: Tracking deleted successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Tracking entry not found
 */
router.delete(
    "/:animeId",
    authMiddleware,
    validate(deleteTrackingSchema),
    deleteTracking,
);

/**
 * @swagger
 * /tracking/{animeId}/reviews:
 *   get:
 *     summary: Get anime reviews
 *     tags:
 *       - Tracking
 *
 *     parameters:
 *       - in: path
 *         name: animeId
 *         required: true
 *         description: Anime ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1535
 *
 *     responses:
 *       200:
 *         description: Anime reviews retrieved successfully
 *
 *       400:
 *         description: Invalid anime ID
 */
router.get(
    "/:animeId/reviews",
    validate(animeTrackingParamSchema),
    getAllUsersReviews,
);

/**
 * @swagger
 * /tracking/{animeId}/average-rating:
 *   get:
 *     summary: Get anime average rating
 *     tags:
 *       - Tracking
 *
 *     parameters:
 *       - in: path
 *         name: animeId
 *         required: true
 *         description: Anime ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1535
 *
 *     responses:
 *       200:
 *         description: Average anime rating retrieved successfully
 *
 *       400:
 *         description: Invalid anime ID
 */
router.get(
    "/:animeId/average-rating",
    validate(animeTrackingParamSchema),
    getAverageRating,
);
export default router;
