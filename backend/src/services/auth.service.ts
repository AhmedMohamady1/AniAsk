import { db } from "../db";
import { refreshTokenTable, usersTable } from "../db/schema/users";
import {
    isUserExists,
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    transformExpirationToDate,
} from "../utils/auth.utils";
import {
    LoginUserInput,
    RegisterUserInput,
} from "../validators/auth.validator";
import { SafeUser } from "../types/user.types";
import { eq, or, SQL } from "drizzle-orm";
import CustomError from "../errors/custom.errors";
import { env } from "../config/configs";
import {
    createEmailVerification,
    verifyEmailOtp,
} from "./email-verification.service";
import { sendVerificationEmail } from "./email.service";

export async function registerUser(data: RegisterUserInput): Promise<SafeUser> {
    const existingUser = await db.query.usersTable.findFirst({
        where: or(
            eq(usersTable.email, data.email),
            eq(usersTable.username, data.username),
        ),
    });

    if (existingUser) {
        throw new CustomError("User already exists", 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const { user, otp } = await db.transaction(async (tx) => {
        const [user] = await tx
            .insert(usersTable)
            .values({
                username: data.username,
                password: hashedPassword,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                emailVerified: false,
            })
            .returning();

        const otp = await createEmailVerification(tx, user.userId);
        return { user, otp };
    });

    // const [user] = await db
    //     .insert(usersTable)
    //     .values({
    //         username: data.username,
    //         password: hashedPassword,
    //         email: data.email,
    //         firstName: data.firstName,
    //         lastName: data.lastName,
    //     })
    //     .returning();

    // const otp = await createEmailVerification(user.userId);
    await sendVerificationEmail(user.email, otp);

    const { password, ...safeUser } = user;

    return safeUser;
}

export async function loginUser(
    data: LoginUserInput,
    userAgent: string,
    ipAddress: string,
) {
    const user = await isUserExists(data);

    if (!user) {
        throw new CustomError("Invalid credentials", 401);
    }

    const isPasswordCorrect = await comparePassword(
        data.password,
        user.password,
    );

    if (!isPasswordCorrect) {
        throw new CustomError("Invalid credentials", 401);
    }

    if (!user.emailVerified) {
        throw new CustomError(
            "Please verify your email before logging in",
            403,
        );
    }

    const refreshToken = generateRefreshToken(user.userId);
    const accessToken = generateAccessToken(user.userId);

    await db.insert(refreshTokenTable).values({
        userId: user.userId,
        token: refreshToken,
        userAgent,
        expiresAt: new Date(
            Date.now() +
                transformExpirationToDate(
                    env.REFRESH_TOKEN_EXPIRATION as string,
                ),
        ),
        ipAddress,
        lastUsedAt: new Date(),
    });

    return { refreshToken, accessToken };
}

export async function getCurrentUser(userId: string) {
    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.userId, userId),
        columns: {
            password: false,
        },
    });
    return user;
}

export async function refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
        throw new CustomError("Refresh token required", 401);
    }

    const storedToken = await db.query.refreshTokenTable.findFirst({
        where: eq(refreshTokenTable.token, refreshToken),
        columns: {
            revoked: true,
            userId: true,
            id: true,
        },
    });

    if (!storedToken) {
        throw new CustomError("Invalid or expired refresh token", 401);
    }

    if (storedToken?.revoked) {
        throw new CustomError("Revoked refresh token", 403);
    }
    const userId = storedToken.userId;

    const accessToken = generateAccessToken(userId);
    await db
        .update(refreshTokenTable)
        .set({
            lastUsedAt: new Date(),
        })
        .where(eq(refreshTokenTable.id, storedToken.id));
    return accessToken;
}

export async function logoutUser(refreshToken: string) {
    return await db
        .update(refreshTokenTable)
        .set({ revoked: true })
        .where(eq(refreshTokenTable.token, refreshToken));
}

export async function verifyUserEmail(email: string, otp: string) {
    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
    });

    if (!user) {
        throw new CustomError("Invalid verification request", 400);
    }

    if (user.emailVerified) {
        throw new CustomError("Email is already verified", 409);
    }

    await verifyEmailOtp(user.userId, otp);
}

export async function resendEmailVerification(email: string) {
    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
    });

    if (!user) {
        throw new CustomError("User not found", 404);
    }

    if (user.emailVerified) {
        throw new CustomError("Email is already verified", 409);
    }

    const otp = await db.transaction(async (tx) => {
        return await createEmailVerification(tx, user.userId);
    });

    await sendVerificationEmail(user.email, otp);
}
