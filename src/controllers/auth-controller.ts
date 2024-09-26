import { Request, Response } from "express";
import { LoginRequest, RegisterRequest, UserRequest } from "../types/user";
import { prisma } from "../config/database";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cloudinary from "../services/cloudinary";

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

        try {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        } catch {
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

export const updateProfile = async (req: UserRequest, res: Response) => {
    try {
        const user = req.user;
        const request: RegisterRequest = req.body;

        const existsUser = await prisma.user.findUnique({ where: { id: user!.id } });

        let cloudinaryResponse = null;

        if (request.profilePicture) {
            if (existsUser?.profilePicturePublicId) {
                await cloudinary.uploader.destroy(existsUser.profilePicturePublicId);
            }

            cloudinaryResponse = await cloudinary.uploader.upload(request.profilePicture, { folder: "products" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user!.id },
            data: {
                ...request,
                profilePicture: cloudinaryResponse?.secure_url || existsUser?.profilePicture, // Gunakan gambar lama jika tidak ada yang baru
                profilePicturePublicId: cloudinaryResponse?.public_id || existsUser?.profilePicturePublicId, // Gunakan public_id lama jika tidak ada yang baru
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
            }
        });

        res.json(updatedUser);
    } catch (error) {
        if (error instanceof Error) {
            console.log(req.user)
            console.log(error)
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
