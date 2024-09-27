import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { create } from "../controllers/post-controller";
import { createValidation } from "../validation/post-validation";

const router = express.Router();

router.post("/posts", verifyToken, createValidation, create);

export default router;