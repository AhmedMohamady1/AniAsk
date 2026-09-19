import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import CustomError from "../errors/custom.errors";

export const validate = (schema: z.ZodType) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return next(
                    new CustomError(
                        error.issues.map((issue) => issue.message).join(", "),
                        400,
                    ),
                );
            }
            next(error);
        }
    };
};
