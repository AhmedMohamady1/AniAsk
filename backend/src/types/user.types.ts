export interface User {
    userId: string;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
}

export type SafeUser = Omit<User, "password">;
