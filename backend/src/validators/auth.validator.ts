import { email, z } from "zod";

export const registerUserSchema = z.object({
    body: z.object({
        username: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Username is Required"
                        : "Username must be a string",
            })
            .min(5, "Username must be at least 5 characters")
            .max(50, "Username must not exceed 50 characters")
            .trim(),
        email: z
            .email({
                error: (issue) =>
                    issue.input === undefined
                        ? "Email is required"
                        : "Invalid email address",
            })
            .max(50, "Email must not exceed 50 characters")
            .trim()
            .lowercase("Email must be lowercased"),
        password: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Password is required"
                        : "Password must be a string",
            })
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password is too long"),
        firstName: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "First name is required"
                        : "First name must be a string",
            })
            .min(2, "First name must be at least 2 characters")
            .max(30, "First name must not exceed 30 characters")
            .trim(),

        lastName: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Last name is required"
                        : "Last name must be a string",
            })
            .min(2, "Last name must be at least 2 characters")
            .max(30, "Last name must not exceed 30 characters")
            .trim(),
    }),
    params: z.object({}),
    query: z.object({}),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];

export const loginUserSchema = z.object({
    body: z
        .object({
            username: z
                .string({ error: "Username must be a string" })
                .min(5, "Username must be at least 5 characters")
                .max(50, "Username must not exceed 50 characters")
                .trim()
                .optional(),
            email: z
                .email("Invalid email address")
                .max(50, "Email must not exceed 50 characters")
                .trim()
                .lowercase("Email must be lowercased")
                .optional(),
            password: z
                .string({ error: "Password must be string" })
                .min(8, "Password must be at least 8 characters")
                .max(128, "Password is too long"),
        })
        .superRefine((data, ctx) => {
            if (!data.email && !data.username) {
                ctx.addIssue({
                    code: "custom",
                    message: "Either email or username must be provided",
                    path: ["email"],
                });
                ctx.addIssue({
                    code: "custom",
                    message: "Either email or username must be provided",
                    path: ["username"],
                });
            }
        }),
    params: z.object({}),
    query: z.object({}),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>["body"];
