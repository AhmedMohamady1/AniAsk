import { Router } from "express";
import {
    login,
    logout,
    me,
    refresh,
    register,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import {
    loginUserSchema,
    registerUserSchema,
} from "../validators/auth.validator";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", validate(registerUserSchema), register);
router.post("/login", validate(loginUserSchema), login);
router.get("/me", authMiddleware, me);
router.post("/refresh", refresh);
router.post("/logout", authMiddleware, logout);

export default router;
