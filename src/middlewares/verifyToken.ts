import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRequest } from "../types/user";

export const verifyToken = async (req: UserRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.sendStatus(401);

    try {
        const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { id: number; name: string; email: string };

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
        };
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.sendStatus(401);
    }
};