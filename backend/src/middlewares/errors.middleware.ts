import { Request, Response, NextFunction } from "express";
import CustomError from "../errors/custom.errors";
import { env } from "../config/configs";

const sendErrorForDev = (err: CustomError, res: Response) => {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorForProd = (err: CustomError, res: Response) => {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
};

const errorHandlerMiddleware = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (env.NODE_ENV === "development") {
        sendErrorForDev(err, res);
    } else {
        sendErrorForProd(err, res);
    }
};

export default errorHandlerMiddleware;
