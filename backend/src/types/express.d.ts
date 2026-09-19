import { JwtPayload } from "jsonwebtoken";

export interface AccessTokenPayload {
    userId: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenPayload;
        }
    }
}
