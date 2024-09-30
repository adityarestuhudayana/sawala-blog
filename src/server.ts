import express, { Request, Response } from 'express';
import authRoutes from "./routes/auth-route";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import cors from 'cors'
import postRoutes from "./routes/post-route";

const app = express();
dotenv.config();
app.use(cookieParser());
app.use(express.json({limit: "10mb"}));
app.use(cors({origin: ["http://localhost:3000"], credentials: true}))

app.use("/api", authRoutes);
app.use("/api", postRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: `request ${req.method} ${req.originalUrl} not found`,
    });
});

export default app;
