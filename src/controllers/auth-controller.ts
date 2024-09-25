import { Request, Response } from "express";
import { LoginRequest, RegisterRequest } from "../types/user";
import { prisma } from "../config/database";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

export const login = async (req: Request, res: Response) => {
    try {
        const request: LoginRequest = req.body;

        const user = await prisma.user.findFirst({
            where: { email: request.email }
        });

        if (!user || !await bcrypt.compare(request.password, user.password)) {
            return res.status(400).json({
                message: "Email or password wrong"
            });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
        };

        const secret: string = process.env.ACCESS_TOKEN_SECRET as string;

        const token = jwt.sign(payload, secret);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        res.json({
            ...payload,
            token,
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(400).json({ message: "No token found" });
        }

        // Verify the token
        try {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        } catch (err) {
            // If token is invalid, clear it anyway but inform the client
            res.clearCookie("token", {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production"
            });
            return res.status(401).json({ message: "Invalid token, cleared cookie" });
        }

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error during logout" });
    }
};