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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *
 *     responses:
 *       201:
 *         description: User registered successfully
 *
 *       400:
 *         description: Validation error
 *
 *       409:
 *         description: User already exists
 */
router.post("/register", validate(registerUserSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Login using either an email address or username.
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/LoginWithEmail'
 *               - $ref: '#/components/schemas/LoginWithUsername'
 *
 *     responses:
 *       200:
 *         description: Login successful
 *
 *       400:
 *         description: Validation error
 *
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate(loginUserSchema), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get information about the currently authenticated user.
 *     tags:
 *       - Auth
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Current authenticated user
 *
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, me);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using the refresh token stored in the HttpOnly cookie.
 *     tags:
 *       - Auth
 *
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *
 *       401:
 *         description: Invalid or missing refresh token
 *
 *       403:
 *         description: Refresh token has been revoked
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags:
 *       - Auth
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: User logged out successfully
 *
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authMiddleware, logout);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     description: Verify a user's email address using the 6-digit OTP.
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmail'
 *
 *     responses:
 *       200:
 *         description: Email verified successfully
 *
 *       400:
 *         description: Invalid email or OTP
 */
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification OTP
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerification'
 *
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *
 *       400:
 *         description: Invalid email
 */
router.post(
    "/resend-verification",
    validate(resendVerificationSchema),
    resendVerification,
);

export default router;
