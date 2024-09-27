import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";

export const createValidation = [
    body("name").notEmpty().withMessage("name is required"),
    body("location").notEmpty().withMessage("location is required"),
    body("description").notEmpty().withMessage("description is required"),
    body("image").notEmpty().withMessage("image is required"),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({
                message: errors.array()
            });
        }
        next();
    }
];