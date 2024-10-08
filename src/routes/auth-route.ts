import express from "express";
import { getUser, login, logout, register, updateProfile } from "../controllers/auth-controller";
import { loginValidation, registerValidation } from "../validation/auth-validation";
import { verifyToken } from "../middlewares/verifyToken";

const router = express.Router();

router.post("/auth/register", registerValidation, register);
router.post("/auth/login", loginValidation, login);
router.post("/auth/logout", logout);
router.get("/users/me", verifyToken,getUser);
router.put("/auth/profile", verifyToken, updateProfile);

export default router;