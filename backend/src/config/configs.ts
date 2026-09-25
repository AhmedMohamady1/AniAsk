import "dotenv/config";
import { z } from "zod";
import { JwtExpiresIn } from "../types/auth.types";

// export const env = {
//   PORT: Number(process.env.PORT),
//   NODE_ENV: process.env.NODE_ENV,
//   DATABASE_URL: process.env.DATABASE_URL,
// };

const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DATABASE_URL: z.string().startsWith("postgresql://"),
    ACCESS_TOKEN_SECRET: z.string().min(1),
    REFRESH_TOKEN_SECRET: z.string().min(1),
    OTP_EXPIRATION: z.custom<JwtExpiresIn>(),
    ACCESS_TOKEN_EXPIRATION: z.custom<JwtExpiresIn>(),
    REFRESH_TOKEN_EXPIRATION: z.custom<JwtExpiresIn>(),
    ANILIST_API_URL: z.url().default("https://graphql.anilist.co"),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.email(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const errorTree = z.treeifyError(parsed.error).properties;
    console.error("❌ Invalid environment variables:", errorTree);
    // console.error(JSON.stringify(errorTree, null, 2));
    process.exit(1);
}

export const env = parsed.data;
