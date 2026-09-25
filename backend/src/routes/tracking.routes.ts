import { Router } from "express";
import {
    createTracking,
    getTracking,
    updateTracking,
    deleteTracking,
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

export default router;
