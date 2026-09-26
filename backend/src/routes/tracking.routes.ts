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
} from "../validators/tracking.validator";

const router = Router();

router.post("/", authMiddleware, validate(trackingSchema), createTracking);
router.get("/", authMiddleware, validate(getTrackingSchema), getTracking);
router.patch(
    "/:animeId",
    authMiddleware,
    validate(updateTrackingSchema),
    updateTracking,
);
router.delete(
    "/:animeId",
    authMiddleware,
    validate(deleteTrackingSchema),
    deleteTracking,
);

router.get(
    "/:animeId/reviews",
    validate(deleteTrackingSchema),
    getAllUsersReviews,
);

router.get(
    "/:animeId/average-rating",
    validate(deleteTrackingSchema),
    getAverageRating,
);
export default router;
