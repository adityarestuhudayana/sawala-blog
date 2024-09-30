import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { create, getRecommendation, getNewest, findOne, likePost, getPopular, deletePost, getFavourites, searchPosts, getMyPosts, searchMyPosts } from "../controllers/post-controller";
import { createValidation } from "../validation/post-validation";

const router = express.Router();

router.post("/posts", verifyToken, createValidation, create);
router.get("/posts/latest", verifyToken, getNewest)
router.get("/posts/me", verifyToken, getMyPosts)
router.get("/posts/me", verifyToken, searchMyPosts)
router.get("/posts/recommendation", verifyToken, getRecommendation);
router.get("/posts/favourites", verifyToken, getFavourites)
router.get("/posts", verifyToken, searchPosts)
router.get("/posts/popular", verifyToken, getPopular);
router.get("/posts/:postId", verifyToken, findOne);
router.post("/posts/:postId/like", verifyToken, likePost);
router.delete("/posts/:id", verifyToken, deletePost)

export default router;