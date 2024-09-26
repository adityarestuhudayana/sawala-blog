import { describe } from "@jest/globals";
import app from "../src/server";
import supertest from "supertest";
import { prisma } from "../src/config/database";

describe('User API', () => {
    let token: string;

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: "testing@gmail.com" }
        });
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it("should register new user", async () => {
            const response = await supertest(app)
                .post("/api/auth/register")
                .send({
                    name: "Testing",
                    email: "testing@gmail.com",
                    password: "test"
                });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'Testing');
            expect(response.body).toHaveProperty('email', 'testing@gmail.com');
        });
    });

    describe('POST /api/auth/login', () => {
        it("should login", async () => {
            const response = await supertest(app)
                .post("/api/auth/login")
                .send({
                    email: "testing@gmail.com",
                    password: "test"
                });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'Testing');
            expect(response.body).toHaveProperty('email', 'testing@gmail.com');
            expect(response.body).toHaveProperty('token');
            token = response.body.token;
        });
    });

    describe('POST /api/auth/login', () => {
        it("should reject login with wrong password", async () => {
            const response = await supertest(app)
                .post("/api/auth/login")
                .send({
                    email: "testing@gmail.com",
                    password: "wrongpassword"
                });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Email or password wrong');
        });
    });

    describe('GET /api/users/me', () => {
        it('should return user data for authenticated user', async () => {
            const response = await supertest(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`); // Use Authorization header

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'Testing');
            expect(response.body).toHaveProperty('email', 'testing@gmail.com');
        });
    });

    describe('POST /api/auth/logout', () => {
        it("should logout the user", async () => {
            const response = await supertest(app)
                .post("/api/auth/logout")
                .set('Cookie', [`token=${token}`]);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Logged out successfully');
        });
    });
});