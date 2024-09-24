import express from "express";
import { register } from "../controllers/auth-controller";
import { registerValidation } from "../validation/auth-validation";

const router = express.Router();

router.post("/auth/register", registerValidation, register);

export default router;