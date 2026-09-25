import { Router } from "express";
import {
    login,
    logout,
    me,
    refresh,
    register,
    verifyEmail,
    resendVerification,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import {
    loginUserSchema,
    registerUserSchema,
    verifyEmailSchema,
    resendVerificationSchema,
} from "../validators/auth.validator";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", validate(registerUserSchema), register);
router.post("/login", validate(loginUserSchema), login);
router.get("/me", authMiddleware, me);
router.post("/refresh", refresh);
router.post("/logout", authMiddleware, logout);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post(
    "/resend-verification",
    validate(resendVerificationSchema),
    resendVerification,
);

export default router;
