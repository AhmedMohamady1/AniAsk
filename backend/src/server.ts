import express, { Response, Request } from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/configs";
import errorHandlerMiddleware from "./middlewares/errors.middleware";
import authRouter from "./routes/auth.route";
import animeRouter from "./routes/anime.routes";
import trackingRouter from "./routes/tracking.routes";
import { db } from "./db/index";
import { usersTable as ut } from "./db/schema/users";
import cookieParser from "cookie-parser";

const app = express();
const PORT: Number = env.PORT;
const morganLogger = env.NODE_ENV === "development" ? "dev" : "combined";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(morganLogger));
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:4173"],
        credentials: true,
    }),
);
app.use(cookieParser());

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "Ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.get("/", async (req: Request, res: Response) => {
    const data = {
        userId: ut.userId,
        username: ut.username,
        email: ut.email,
        firstName: ut.firstName,
        lastName: ut.lastName,
        createdAt: ut.createdAt,
        updatedAt: ut.updatedAt,
    };
    const users = await db.select(data).from(ut);
    res.json({ data: users, message: "success" });
});

app.use("/auth", authRouter);
app.use("/anime", animeRouter);
app.use("/tracking", trackingRouter);

app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log("Api Health: ", "http://localhost:4000/health");
});
