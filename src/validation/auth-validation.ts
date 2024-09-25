import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";

export const registerValidation = [
    body("name").notEmpty().withMessage("name is required"),
    body("email")
        .notEmpty().withMessage("email is required")
        .bail()
        .isEmail().withMessage("email format not valid"),
    body("password").notEmpty().withMessage("password is required"),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array()
            })
        }
        next()
    }
];

export const loginValidation = [
    body("email")
        .notEmpty().withMessage("email is required")
        .bail()
        .isEmail().withMessage("email format not valid"),
    body("password").notEmpty().withMessage("password is required"),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation error",
                errors: errors.array()
            })
        }
        next()
    }
];