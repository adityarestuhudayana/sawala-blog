import { Response } from "express";
import { CreatePostRequest } from "../types/post";
import { UserRequest } from "../types/user";
import { prisma } from "../config/database";
import cloudinary from "../services/cloudinary";

export const create = async (req: UserRequest, res: Response) => {
    try {
        const request: CreatePostRequest = req.body;
        const user = req.user;
        let cloudinaryResponse = null;

        cloudinaryResponse = await cloudinary.uploader.upload(request.image, { folder: "products" });
        request.image = cloudinaryResponse?.secure_url;

        const post = await prisma.post.create({
            data: {
                ...request,
                user_id: user!.id,
            },
        });

        res.status(201).json(post);
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        } else {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export const getNewest = async (req: UserRequest, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                created_at: 'desc',
            },
            take: 5,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profilePicture: true,
                    }
                }

            }
        })
        res.status(200).json(posts)
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        } else {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}