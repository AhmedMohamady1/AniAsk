import jwt from "jsonwebtoken";
import { env } from "../config/configs";
import bcrypt from "bcrypt";
import { LoginUserInput } from "../validators/auth.validator";
import { eq, or, SQL } from "drizzle-orm";
import { usersTable } from "../db/schema";
import { db } from "../db";
import { AccessTokenPayload } from "../types/express";

export function generateAccessToken(userId: string) {
    return jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET, {
        expiresIn: env.ACCESS_TOKEN_EXPIRATION,
    });
}

export function generateRefreshToken(userId: string) {
    return jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRATION,
    });
}

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(input: string, hashed: string) {
    return bcrypt.compare(input, hashed);
}

export async function isUserExists(data: LoginUserInput) {
    const conditions: SQL[] = [];

    if (data.email) {
        conditions.push(eq(usersTable.email, data.email));
    }

    if (data.username) {
        conditions.push(eq(usersTable.username, data.username));
    }
    const existingUser = await db.query.usersTable.findFirst({
        where: or(...conditions),
    });

    return existingUser;
}

// export function transformExpirationToDate(expires: string) {
//     const days = parseInt(expires.split("")[0]) * 24 * 60 * 60 * 1000;
//     const hours = parseInt(expires.split("")[0]) * 60 * 60 * 1000;
//     const minutes = parseInt(expires.split("")[0]) * 60 * 1000;
//     const cond = expires.split("")[1];
//     const expirationDate = cond === "d" ? days : cond === "h" ? hours : minutes;
//     return expirationDate;
// }

export function transformExpirationToDate(expires: string): number {
    const match = expires.match(/^(\d+)([dhm])$/);

    if (!match) {
        throw new Error(
            "Invalid expiration format. Use formats like 10m, 2h, or 7d.",
        );
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
        case "d":
            return value * 24 * 60 * 60 * 1000;

        case "h":
            return value * 60 * 60 * 1000;

        case "m":
            return value * 60 * 1000;
        default:
            throw new Error("Invalid expiration unit");
    }
}

export const isProd = env.NODE_ENV === "production" ? true : false;

export function verifyAccessToken(token: string) {
    const decoded = jwt.verify(
        token,
        env.ACCESS_TOKEN_SECRET,
    ) as AccessTokenPayload;
    return decoded;
}
