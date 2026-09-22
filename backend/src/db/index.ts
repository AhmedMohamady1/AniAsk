import { env } from "../config/configs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

const logger = env.NODE_ENV === "development";

export const db = drizzle(pool, { schema, logger: logger });
