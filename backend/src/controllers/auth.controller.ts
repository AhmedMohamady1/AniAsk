import { Response, Request } from "express";
import {
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
} from "../services/auth.service";
import {
    LoginUserInput,
    RegisterUserInput,
} from "../validators/auth.validator";
import { env } from "../config/configs";
import { isProd, transformExpirationToDate } from "../utils/auth.utils";

export const register = async (req: Request, res: Response) => {
    const data: RegisterUserInput = req.body;
    const user = await registerUser(data);
    res.status(201).json({ message: "user created", user });
};

export const login = async (req: Request, res: Response) => {
    const data: LoginUserInput = req.body;
    const userAgent = req.get("user-agent") || "unknown";
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const { accessToken, refreshToken } = await loginUser(
        data,
        userAgent,
        ipAddress,
    );

    res.cookie("refresh-token", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "strict",
        maxAge: transformExpirationToDate(
            env.REFRESH_TOKEN_EXPIRATION as string,
        ),
    });

    res.status(200).json({
        success: true,
        accessToken,
    });
};

export const me = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await getCurrentUser(userId);
    res.status(200).json(user);
};

export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refresh-token"];
    const accessToken = await refreshAccessToken(refreshToken);
    res.status(201).json({ accessToken });
};

export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refresh-token"];
    if (refreshToken) {
        await logoutUser(refreshToken);
    }

    if (refreshToken) {
        res.clearCookie("refresh-token", {
            httpOnly: true,
            secure: isProd,
            sameSite: "strict",
        });
    }
    res.status(200).json({ success: true, message: "Logged out successfully" });
};
