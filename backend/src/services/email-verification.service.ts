import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { emailVerificationTable, usersTable } from "../db/schema";
import CustomError from "../errors/custom.errors";
import {
    hashPassword,
    transformExpirationToDate,
    comparePassword,
} from "../utils/auth.utils";
import { env } from "../config/configs";

function generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function createEmailVerification(
    tx: DbTransaction,
    userId: string,
) {
    const existingVerification =
        await tx.query.emailVerificationTable.findFirst({
            where: eq(emailVerificationTable.userId, userId),
        });

    if (existingVerification) {
        const elapsed = Date.now() - existingVerification.createdAt.getTime();

        const resendCooldown = 60 * 1000;

        if (elapsed < resendCooldown) {
            throw new CustomError(
                "Please wait before requesting another verification code",
                429,
            );
        }

        await tx
            .delete(emailVerificationTable)
            .where(eq(emailVerificationTable.id, existingVerification.id));
    }
    await tx
        .delete(emailVerificationTable)
        .where(eq(emailVerificationTable.userId, userId));

    const otp = generateOtp();

    const otpHash = await hashPassword(otp);

    const expiresAt = new Date(
        Date.now() + transformExpirationToDate(env.OTP_EXPIRATION as string),
    );

    await tx.insert(emailVerificationTable).values({
        userId,
        otpHash,
        expiresAt,
    });

    return otp;
}

export async function verifyEmailOtp(userId: string, otp: string) {
    await db.transaction(async (tx) => {
        const verification = await tx.query.emailVerificationTable.findFirst({
            where: eq(emailVerificationTable.userId, userId),
        });

        if (!verification) {
            throw new CustomError("Verification code not found", 404);
        }

        if (verification.expiresAt.getTime() < Date.now()) {
            await tx
                .delete(emailVerificationTable)
                .where(eq(emailVerificationTable.id, verification.id));

            throw new CustomError("Verification code has expired", 400);
        }
        if (verification.attempts >= 5) {
            throw new CustomError("Too many verification attempts", 429);
        }

        const isValid = await comparePassword(otp, verification.otpHash);

        if (!isValid) {
            await db
                .update(emailVerificationTable)
                .set({
                    attempts: verification.attempts + 1,
                })
                .where(eq(emailVerificationTable.id, verification.id));

            throw new CustomError("Invalid verification code", 400);
        }
        await tx
            .update(usersTable)
            .set({
                emailVerified: true,
            })
            .where(eq(usersTable.userId, userId));

        await tx
            .delete(emailVerificationTable)
            .where(eq(emailVerificationTable.id, verification.id));
    });
}
