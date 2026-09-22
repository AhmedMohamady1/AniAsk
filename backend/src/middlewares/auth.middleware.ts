import { Response, Request, NextFunction } from "express";
import CustomError from "../errors/custom.errors";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/auth.utils";

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const authHeaders = req.headers.authorization;
    if (!authHeaders?.startsWith("Bearer ")) {
        return next(new CustomError("Authentication required", 401));
    }

    const token: string = authHeaders?.split(" ")[1] as string;
    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new CustomError("Token expired", 401));
        }
        return next(new CustomError("Invalid token", 401));
    }
};
