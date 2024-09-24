import { describe } from "@jest/globals"
import { app } from "../src/server";
import supertest from "supertest";
import { prisma } from "../src/config/database";

describe('User API', () => {

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

});