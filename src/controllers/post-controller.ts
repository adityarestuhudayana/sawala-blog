import { Request, Response } from "express";
import { CreatePostRequest } from "../types/post";
import { UserRequest } from "../types/user";
import { prisma } from "../config/database";
import cloudinary from "../services/cloudinary";
import { Prisma } from "@prisma/client";

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

export const getRecommendation = async (req: Request, res: Response) => {
    try {
        const postsCount = await prisma.post.count();

        if (postsCount === 0) {
            return res.status(404).json({ message: "there is no data posts" });
        }

        const skip = Math.floor(Math.random() * postsCount);
        let take = 5;

        if (postsCount - skip < take) {
            take = postsCount - skip;
        }

        const posts = await prisma.post.findMany({
            take,
            skip,
            orderBy: {
                created_at: "desc",
            },
            select: {
                id: true,
                name: true,
                image: true,
                user: {
                    select: {
                        name: true,
                        profilePicture: true
                    }
                }
            }
        });

        res.json({ data: posts });
    } catch (error) {
        if (error instanceof Error) return res.status(500).json({ message: error.message });
        res.status(500).json({ message: "Internal server error" });
    }
}

export const findOne = async (req: Request, res: Response) => {
    try {
        const postId: number = parseInt(req.params.postId);

        const post = await prisma.post.findFirst({
            where: {
                id: postId,
            },
            include: {
                user: true,
                favouritedBy: true
            }
        });

        if (!post) return res.status(404).json({ message: "Post not found" });

        res.json({
            id: post.id,
            name: post.name,
            description: post.description,
            image: post.image,
            likes: post.favouritedBy.length,
            created_at: post.created_at,
            user: post.user,
        });
    } catch (error) {
        if (error instanceof Error) return res.status(500).json({ message: error.message });
        res.status(500).json({ message: "Internal server error" });
    }
}

export const likePost = async (req: UserRequest, res: Response) => {
    try {
        const postId: number = parseInt(req.params.postId);
        const userId: number = req.user!.id;

        const updatedPost = await prisma.post.update({
            where: {
                id: postId,
            },
            data: {
                favouritedBy: {
                    connect: { id: userId },
                },
            },
            include: {
                user: true,
                favouritedBy: true,
            }
        });

        const response = {
            id: updatedPost.id,
            name: updatedPost.name,
            description: updatedPost.description,
            image: updatedPost.image,
            likes: updatedPost.favouritedBy.length,
            created_at: updatedPost.created_at,
            user: updatedPost.user,
        };

        res.json(response);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({message: "Internal server error"});
    }
}

export const getPopular = async (req: UserRequest, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: [
                { visited: "desc" },
                {
                    favouritedBy: {
                        _count: "desc"
                    }
                }
            ],
            include: {
                user: true
            }
        });

        res.json({data: posts});
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        } else {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
  
export const deletePost = async (req: UserRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const postId = parseInt(req.params.id)

        const post = await prisma.post.findUnique({
            where: { id: postId }
        })

        if (!post) {
            res.status(404).json({ message: "Post not found" })
        }

        await prisma.post.delete({
            where: { id: postId }
        })
        res.status(200).json({ message: "Post deleted successfully" })

    } catch (error) {
        if (error instanceof Error) return res.status(500).json({ message: error.message });
        res.status(500).json({ message: "Internal server error" });
    }
}