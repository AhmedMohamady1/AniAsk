import express, { Response, Request } from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/configs";
import errorHandlerMiddleware from "./middlewares/errors.middleware";

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

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "Ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log("Api Health: ", "http://localhost:4000/health");
});
