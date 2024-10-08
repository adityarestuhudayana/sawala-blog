import { Request, Response } from "express";
import { CreatePostRequest } from "../types/post";
import { UserRequest } from "../types/user";
import { prisma } from "../config/database";
import cloudinary from "../services/cloudinary";
import { Prisma } from "@prisma/client";

type updatePostRequest = {
  name?: string;
  location?: string;
  description?: string;
  image?: string;
  imagePublicId?: string | null;
};

export const create = async (req: UserRequest, res: Response) => {
  try {
    const request: CreatePostRequest = req.body;
    const user = req.user;
    let cloudinaryResponse = null;

    cloudinaryResponse = await cloudinary.uploader.upload(request.image, {
      folder: "posts",
    });
    request.image = cloudinaryResponse?.secure_url;

    const post = await prisma.post.create({
      data: {
        ...request,
        user_id: user!.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
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
};

export const getMyPosts = async (req: UserRequest, res: Response) => {
  const keyword = req.query.search as string;
  if (keyword) {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { location: { contains: keyword } },
          { description: { contains: keyword } },
        ],
        user_id: req.user!.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        favouritedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }

    return res.status(200).json(posts);
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user!.id,
      },
      include: {
        posts: {
          include: {
            author: true,
          },
        },
      },
    });

    res.status(200).json({ data: user?.posts });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const searchMyPosts = async (req: UserRequest, res: Response) => {
  const keyword = req.query.search as string;

  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { location: { contains: keyword } },
          { description: { contains: keyword } },
        ],
        user_id: req.user!.id,
      },
      include: {
        author: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }
    res.status(200).json(posts);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getNewest = async (req: UserRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        created_at: "desc",
      },
      take: 5,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        favouritedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getRecommendation = async (req: Request, res: Response) => {
  try {
    const postCount = await prisma.post.count();
    let posts = await prisma.post.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
        image: true,
        author: true,
      },
    });

    const randomNumbers = new Set();
    if (postCount < 5) {
      const n = postCount;

      while (randomNumbers.size < n) {
        randomNumbers.add(Math.floor(Math.random() * postCount));
      }
    } else {
      const n = 5;

      while (randomNumbers.size < n) {
        randomNumbers.add(Math.floor(Math.random() * postCount));
      }
    }

    const uniqueRandomNumbers: number[] = Array.from(randomNumbers) as number[];

    posts = uniqueRandomNumbers.map((index) => posts[index]);

    res.json({ data: posts });
  } catch (error) {
    if (error instanceof Error)
      return res.status(500).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const findOne = async (req: Request, res: Response) => {
  try {
    const postId: number = parseInt(req.params.postId);

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
      include: {
        author: true,
        favouritedBy: true,
      },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    await prisma.post.update({
      where: {
        id: post.id,
      },
      data: {
        visited: post.visited + 1,
      },
    });

    res.json(post);
  } catch (error) {
    if (error instanceof Error)
      return res.status(500).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const likePost = async (req: UserRequest, res: Response) => {
  try {
    const postId: number = parseInt(req.params.postId);
    const userId: number = req.user!.id;
    let updatedPost;

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
      include: {
        favouritedBy: true,
      },
    });

    const isUserAlreadyLiked = post?.favouritedBy.find((u) => u.id === userId);

    if (isUserAlreadyLiked) {
      updatedPost = await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          favouritedBy: {
            disconnect: {
              id: userId,
            },
          },
        },
        include: {
          favouritedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      });

      return res.json(updatedPost);
    } else {
      updatedPost = await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          favouritedBy: {
            connect: { id: userId },
          },
        },
        include: {
          favouritedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      });
      return res.json(updatedPost);
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFavourites = async (req: UserRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user!.id,
      },
      include: {
        favourites: {
          include: {
            favouritedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
              },
            },
            author: true,
          },
        },
      },
    });

    res.status(200).json({ data: user?.favourites });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const searchPosts = async (req: UserRequest, res: Response) => {
  const keyword = req.query.search as string;

  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { location: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        favouritedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }
    res.status(200).json(posts);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getPopular = async (req: UserRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: [
        { visited: "desc" },
        {
          favouritedBy: {
            _count: "desc",
          },
        },
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        favouritedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
    res.json({ data: posts });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const deletePost = async (req: UserRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const postId = parseInt(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ message: "Post not found" });
    }

    await prisma.post.delete({
      where: { id: postId },
    });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    if (error instanceof Error)
      return res.status(500).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePost = async (req: UserRequest, res: Response) => {
  const data: updatePostRequest = req.body;
  try {
    const { postId } = req.params;
    let cloudinaryResponse = null;
    let post;

    post = await prisma.post.findFirst({
      where: {
        id: parseInt(postId),
      },
    });

    if (!post) {
      return res
        .json({ message: `post with id ${postId} not found` })
        .status(404);
    }

    if (data?.image) {
      cloudinaryResponse = await cloudinary.uploader.upload(data.image, {
        folder: "posts",
      });
    }

    data.image = cloudinaryResponse?.secure_url || post.image;
    data.imagePublicId = cloudinaryResponse?.public_id || post.imagePublicId;

    await prisma.post.update({
      where: {
        id: post.id,
      },
      data: {
        ...data,
      },
    });

    post = await prisma.post.findFirst({
      where: {
        id: post.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        favouritedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    res.json(post);
  } catch (error) {
    console.log(error);
    if (error instanceof Error)
      return res.status(500).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  }
};
