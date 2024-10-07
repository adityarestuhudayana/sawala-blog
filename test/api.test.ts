import { describe } from "@jest/globals";
import app from "../src/server";
import supertest from "supertest";
import { prisma } from "../src/config/database";
import fs from "fs";

function imageToBase64(filePath: string) {
  const image = fs.readFileSync(filePath); // Membaca gambar dari file
  const base64Image = Buffer.from(image).toString("base64"); // Mengonversi menjadi base64
  return `data:image/jpeg;base64,${base64Image}`; // Menambahkan prefix data URI
}

describe("API Test", () => {
  let token: string;

  let testUserId: number;
  let newProfilePicture = imageToBase64("./test/test-image.png");
  let testEmail = "testing@gmail.com";

  let name = "test";
  let location = "test";
  let description = "test";
  let newPostImage = imageToBase64("./test/test-image.png");
  let postId: number;

  beforeAll(async () => {
    await supertest(app).post("/api/auth/register").send({
      name: "Testing",
      email: testEmail,
      password: "test",
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

  describe("POST /api/auth/login", () => {
    it("should login", async () => {
      const response = await supertest(app).post("/api/auth/login").send({
        email: testEmail,
        password: "test",
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("email", "testing@gmail.com");
      expect(response.body).toHaveProperty("token");
      token = response.body.token;
      testUserId = response.body.id;
    });
  });

  describe("GET /api/users/me", () => {
    it("should return user data for authenticated user", async () => {
      const response = await supertest(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`); // Use Authorization header

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("email", "testing@gmail.com");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should rejected login", async () => {
      const response = await supertest(app).post("/api/auth/login").send({
        email: testEmail,
        password: "wrongpassword",
      });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Email or password wrong"
      );
    });
  });

  describe("PUT /api/auth/profile", () => {
    it("should update user profile", async () => {
      const response = await supertest(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Name",
          profilePicture: newProfilePicture, // Kirim gambar baru
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", "Updated Name");
      expect(response.body).toHaveProperty("email", testEmail);
      expect(response.body).toHaveProperty("profilePicture");
    }, 20000);
  });

  describe("POST /api/posts", () => {
    it("should create new post", async () => {
      const response = await supertest(app)
        .post("/api/posts")
        .send({
          name,
          location,
          description,
          image: newPostImage,
        })
        .set("Authorization", `Bearer ${token}`);

      postId = response.body.id;
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", name);
      expect(response.body).toHaveProperty("location", location);
      expect(response.body).toHaveProperty("description", description);
      expect(response.body).toHaveProperty("image");
      expect(response.body).toHaveProperty("created_at");
    }, 10000);
  });

  describe("GET /api/posts/me", () => {
    it("should return all posts created by the authenticated user", async () => {
      const response = await supertest(app)
        .get("/api/posts/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/posts/latest", () => {
    it("should return latest posts", async () => {
      const response = await supertest(app)
        .get("/api/posts/latest")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      response.body.forEach((post: any) => {
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("name");
        expect(post).toHaveProperty("location");
        expect(post).toHaveProperty("description");
        expect(post).toHaveProperty("image");
        expect(post).toHaveProperty("created_at");
        expect(post).toHaveProperty("updated_at");
        expect(post).toHaveProperty("author");
        expect(post.author).toHaveProperty("name");
        expect(post.author).toHaveProperty("email");
        expect(post.author).toHaveProperty("profilePicture");
      });
    });
  });

  describe("GET /api/posts/recommendation", () => {
    it("should get posts data random", async () => {
      const response = await supertest(app)
        .get("/api/posts/recommendation")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("image");
      expect(response.body.data[0]).toHaveProperty("author");
      expect(response.body.data[0].author).toHaveProperty("profilePicture");
    });
  });

  describe("GET /api/posts/:id", () => {
    it("should findone post", async () => {
      const response = await supertest(app)
        .get(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("description");
      expect(response.body).toHaveProperty("image");
      expect(response.body).toHaveProperty("created_at");
      expect(response.body).toHaveProperty("likes");
      expect(response.body).toHaveProperty("author");
      expect(response.body).toHaveProperty("location");
      expect(response.body.author).toHaveProperty("profilePicture");
    });
  });

  describe("GET /api/posts/me?search", () => {
    it("should return posts matching the search keyword for the authenticated user", async () => {
      const response = await supertest(app)
        .get(`/api/posts/me?search=test`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return 404 if no posts match the search keyword", async () => {
      const response = await supertest(app)
        .get(`/api/posts/me?search=gakada`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "No posts found");
    });
  });

  describe("POST /api/posts/:id/like", () => {
    it("should like post", async () => {
      const response = await supertest(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("description");
      expect(response.body).toHaveProperty("image");
      expect(response.body).toHaveProperty("created_at");
      expect(response.body).toHaveProperty("likes", 1);
      expect(response.body).toHaveProperty("author");
      expect(response.body.author).toHaveProperty("id", testUserId);
      expect(response.body.author).toHaveProperty("profilePicture");
    });
  });

  describe("POST /api/posts/:id/like", () => {
    it("should unlike post", async () => {
      const response = await supertest(app)
        .post(`/api/posts/${postId}/like`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("description");
      expect(response.body).toHaveProperty("image");
      expect(response.body).toHaveProperty("created_at");
      expect(response.body).toHaveProperty("likes", 0);
    });
  });

  describe("GET /api/posts/popular", () => {
    it("should get popular post", async () => {
      const response = await supertest(app)
        .get(`/api/posts/popular`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("description");
      expect(response.body.data[0]).toHaveProperty("image");
      expect(response.body.data[0]).toHaveProperty("created_at");
      expect(response.body.data[0]).toHaveProperty("author");
      expect(response.body.data[0].author).toHaveProperty("profilePicture");
    });
  });

  describe("GET /api/posts?search", () => {
    it("should return posts based on search keyword", async () => {
      const response = await supertest(app)
        .get("/api/posts?search=test")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("image");
      expect(response.body[0]).toHaveProperty("author");
      expect(response.body[0].author).toHaveProperty("name");
    });

    it("should return 404 if no posts match the search keyword", async () => {
      const response = await supertest(app)
        .get("/api/posts?search=nonexistent")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "No posts found");
    });
  });

  describe("GET /api/posts/favourites", () => {
    it("should get the top favourite posts", async () => {
      const response = await supertest(app)
        .get("/api/posts/favourites")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toBeInstanceOf(Array);

      response.body.data.forEach((post: any) => {
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("name");
        expect(post).toHaveProperty("description");
        expect(post).toHaveProperty("image");
        expect(post).toHaveProperty("created_at");
        expect(post).toHaveProperty("likes");
        expect(post).toHaveProperty("user");
        expect(post.user).toHaveProperty("profilePicture");
      });
    });
  });

  describe("PUT /api/posts/:postId", () => {
    it("should update post", async () => {
      const response = await supertest(app)
        .put(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New Name",
          image: newPostImage,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "New Name");
      expect(response.body).toHaveProperty("image");
      expect(response.body).toHaveProperty("author");
    },
  10000);
  });

  describe("DELETE /api/posts/:id", () => {
    it("should delete the user's own post", async () => {
      const response = await supertest(app)
        .delete(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Post deleted successfully"
      );
      const postCheck = await prisma.post.findUnique({
        where: { id: postId },
      });
      expect(postCheck).toBeNull();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout the user", async () => {
      const response = await supertest(app)
        .post("/api/auth/logout")
        .set("Cookie", [`token=${token}`]);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Logged out successfully"
      );
    });
  });
});
