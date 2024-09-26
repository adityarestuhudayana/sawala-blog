import express, { Request, Response } from 'express';
import authRoutes from "./routes/auth-route";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();
dotenv.config();
app.use(cookieParser());
app.use(express.json());
app.use(cors({origin: ["http://localhost:5173"], credentials: true}))

app.use("/api", authRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: `request ${req.method} ${req.originalUrl} not found`,
    });
});

export default app;
