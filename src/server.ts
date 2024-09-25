import express, { Request, Response } from 'express';
import authRoutes from "./routes/auth-route";
import dotenv from 'dotenv';

const app = express();
dotenv.config();
app.use(express.json());

app.use("/api", authRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: `request ${req.method} ${req.originalUrl} not found`,
    });
});

export default app;