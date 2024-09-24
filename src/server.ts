import express, { Request, Response } from 'express';
import authRoutes from "./routes/auth-route";

export const app = express();
app.use(express.json());

app.use("/api", authRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: `request ${req.method} ${req.originalUrl} not found`,
    });
});

export default app;