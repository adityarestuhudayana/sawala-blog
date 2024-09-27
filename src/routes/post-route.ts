import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { create, getRecommendation, getNewest } from "../controllers/post-controller";
import { createValidation } from "../validation/post-validation";

const router = express.Router();

router.post("/posts", verifyToken, createValidation, create);
router.get("/posts/latest", verifyToken, getNewest)
router.get("/posts/recommendation", verifyToken, getRecommendation);

export default router;