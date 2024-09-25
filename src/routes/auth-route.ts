import express from "express";
import { login, register } from "../controllers/auth-controller";
import { loginValidation, registerValidation } from "../validation/auth-validation";

const router = express.Router();

router.post("/auth/register", registerValidation, register);
router.post("/auth/login", loginValidation, login);

export default router;