import { Request, Response } from "express";
import { RegisterRequest } from "../types/user";
import { prisma } from "../config/database";
import bcrypt from 'bcrypt';

export const register = async (req: Request, res: Response) => {
    try {
        const request: RegisterRequest = req.body;

        const isEmailAlreadyUsed = await prisma.user.findFirst({
            where: {
                email: request.email,
            }
        });

        if (isEmailAlreadyUsed) {
            return res.status(400).json({
                message: "User with this email already exists",
            });
        }

        request.password = await bcrypt.hash(request.password, 10);

        const user = await prisma.user.create({
            data: request,
            select: {
                id: true,
                name: true,
                email: true,
            }
        });

        res.status(201).json(user);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}