import { describe } from "@jest/globals"
import app from "../src/server";
import supertest from "supertest";
import { prisma } from "../src/config/database";
import fs from "fs";

function imageToBase64(filePath: string) {
    const image = fs.readFileSync(filePath); // Membaca gambar dari file
    const base64Image = Buffer.from(image).toString('base64'); // Mengonversi menjadi base64
    return `data:image/jpeg;base64,${base64Image}`; // Menambahkan prefix data URI
}

describe('User API', () => {
    let token: string;
    let newProfilePicture = imageToBase64("./test/test-image.png");
    let testEmail = "testing@gmail.com"

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: testEmail }
        });
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it("should register new user", async () => {
            const response = await supertest(app)
                .post("/api/auth/register")
                .send({
                    name: "Testing",
                    email: testEmail,
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
                    email: testEmail,
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
        it("should rejected login", async () => {
            const response = await supertest(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: "wrongpassword"
                });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Email or password wrong');
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

    describe('PUT /api/auth/profile', () => {
        it("should update user profile", async () => {
            const response = await supertest(app)
                .put("/api/auth/profile")
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: "Updated Name",
                    profilePicture: newProfilePicture // Kirim gambar baru
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'Updated Name');
            expect(response.body).toHaveProperty('email', testEmail);
            expect(response.body).toHaveProperty('profilePicture');
        }, 10000);
    });
});