
import { describe } from "@jest/globals";
import app from "../src/server";
import supertest from "supertest";
import { prisma } from "../src/config/database";
import fs from "fs";

function imageToBase64(filePath: string) {
    const image = fs.readFileSync(filePath); // Membaca gambar dari file
    const base64Image = Buffer.from(image).toString('base64'); // Mengonversi menjadi base64
    return `data:image/jpeg;base64,${base64Image}`; // Menambahkan prefix data URI
}

describe('API Test', () => {
    let token: string;

    let testUserId: number;
    let newProfilePicture = imageToBase64("./test/test-image.png");
    let testEmail = "testing@gmail.com"

    let name = "test";
    let location = "test";
    let description = "test";
    let newPostImage = imageToBase64("./test/test-image.png");
    let postId: number;

    beforeAll(async () => {
        await supertest(app)
            .post("/api/auth/register")
            .send({
                name: "Testing",
                email: testEmail,
                password: "test"
            });
    });

    afterAll(async () => {
        await prisma.post.deleteMany({
            where: { user_id: testUserId },
        });
        await prisma.user.delete({
            where: { id: testUserId },
        });
        await prisma.$disconnect();
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
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('email', 'testing@gmail.com');
            expect(response.body).toHaveProperty('token');
            token = response.body.token;
            testUserId = response.body.id;
        });
    });

    describe('GET /api/users/me', () => {
        it('should return user data for authenticated user', async () => {
            const response = await supertest(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`); // Use Authorization header

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('email', 'testing@gmail.com');
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
        }, 20000);
    });

    describe('POST /api/posts', () => {
        it("should create new post", async () => {
            const response = await supertest(app)
                .post("/api/posts")
                .send({
                    name,
                    location,
                    description,
                    image: newPostImage
                })
                .set('Authorization', `Bearer ${token}`);

            postId = response.body.id;
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', name);
            expect(response.body).toHaveProperty('location', location);
            expect(response.body).toHaveProperty('description', description);
            expect(response.body).toHaveProperty('image');
            expect(response.body).toHaveProperty('created_at');
            expect(response.body).toHaveProperty('updated_at');
        }, 10000);
    });
  
    describe('GET /api/posts/newest', () => {
        it("should return newest posts", async () => {
            const response = await supertest(app)
                .get("/api/posts/newest")
                .set('Authorization', `Bearer ${token}`);
    
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
    
            response.body.forEach((post: any) => {
                expect(post).toHaveProperty('id');
                expect(post).toHaveProperty('name');
                expect(post).toHaveProperty('location');
                expect(post).toHaveProperty('description');
                expect(post).toHaveProperty('image');
                expect(post).toHaveProperty('created_at');
                expect(post).toHaveProperty('updated_at');
                expect(post).toHaveProperty('user');
                expect(post.user).toHaveProperty('name');
                expect(post.user).toHaveProperty('email');
                expect(post.user).toHaveProperty('profilePicture');
            });
        });
    });

    describe('GET /api/posts/recommendation', () => {
        it("should get posts data random", async () => {
            const response = await supertest(app)
                .get("/api/posts/recommendation")
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data[0]).toHaveProperty('id');
            expect(response.body.data[0]).toHaveProperty('name');
            expect(response.body.data[0]).toHaveProperty('image');
            expect(response.body.data[0]).toHaveProperty('user');
            expect(response.body.data[0].user).toHaveProperty('profilePicture');
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