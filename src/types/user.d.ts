import { Request } from "express";

export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
    profilePicture?: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export interface UserRequest extends Request {
    user?: {
        id: number;
        name: string;
        email: string;
        profilePicture?: string
    };
}