import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Point the app at an isolated data directory before it is imported.
const testDataDir = path.join(__dirname, "test-data");
process.env.DATA_DIR = testDataDir;
process.env.NODE_ENV = "test";

let app;

const articlesPath = path.join(testDataDir, "articles.json");
const internsPath = path.join(testDataDir, "interns.json");
const categoriesPath = path.join(testDataDir, "categories.json");

async function resetData() {
  await fs.ensureDir(path.join(testDataDir, "task-files"));
  await fs.writeJson(articlesPath, { articles: [] });
  await fs.writeJson(internsPath, { interns: [] });
  await fs.writeJson(categoriesPath, { categories: [] });
}

beforeAll(async () => {
  await fs.remove(testDataDir);
  await resetData();
  // Import the real Express app (env vars are now set).
  ({ default: app } = await import("../src/app.js"));
});

afterAll(async () => {
  await fs.remove(testDataDir);
});

beforeEach(resetData);

describe("Knowledge Base API", () => {
  describe("Articles API", () => {
    it("GET /api/articles should return empty array initially", async () => {
      const response = await request(app).get("/api/articles");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("POST /api/articles should create a new article", async () => {
      const newArticle = {
        title: "Test Article",
        content: "This is a test article",
        summary: "Test summary",
        author: "Test Author",
        category: "test",
        status: "draft",
        priority: "low",
        tags: ["test"],
        categories: ["test"],
      };
      const response = await request(app).post("/api/articles").send(newArticle);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...newArticle,
        createdAt: expect.any(String),
      });
    });

    it("PUT /api/articles/:id should update an article", async () => {
      const newArticle = {
        title: "Original Title",
        content: "Original content",
        summary: "Original summary",
      };
      const postResponse = await request(app)
        .post("/api/articles")
        .send(newArticle);
      const articleId = postResponse.body.id;

      const response = await request(app)
        .put(`/api/articles/${articleId}`)
        .send({ title: "Updated Title", content: "Updated content" });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: articleId,
        title: "Updated Title",
        content: "Updated content",
        summary: "Original summary",
        updatedAt: expect.any(String),
      });
    });

    it("DELETE /api/articles/:id should delete an article", async () => {
      const postResponse = await request(app)
        .post("/api/articles")
        .send({ title: "Test Article" });
      const articleId = postResponse.body.id;

      const response = await request(app).delete(`/api/articles/${articleId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const getResponse = await request(app).get("/api/articles");
      expect(getResponse.body).toEqual([]);
    });

    it("POST /api/articles/:id/comments should add a comment", async () => {
      const postResponse = await request(app)
        .post("/api/articles")
        .send({ title: "Test Article" });
      const articleId = postResponse.body.id;

      const newComment = {
        name: "Test User",
        email: "test@example.com",
        content: "This is a test comment",
      };
      const response = await request(app)
        .post(`/api/articles/${articleId}/comments`)
        .send(newComment);
      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0]).toMatchObject({
        id: expect.any(String),
        ...newComment,
        createdAt: expect.any(String),
      });
    });
  });

  describe("Interns API", () => {
    it("GET /api/interns should return empty array initially", async () => {
      const response = await request(app).get("/api/interns");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("POST /api/interns should create a new intern", async () => {
      const newIntern = {
        name: "Test Intern",
        email: "intern@example.com",
        program: "Test Program",
        status: "active",
      };
      const response = await request(app).post("/api/interns").send(newIntern);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...newIntern,
        createdAt: expect.any(String),
      });
    });

    it("PUT /api/interns/:id should update an intern", async () => {
      const postResponse = await request(app)
        .post("/api/interns")
        .send({ name: "Original Intern", email: "intern@example.com" });
      const internId = postResponse.body.id;

      const response = await request(app)
        .put(`/api/interns/${internId}`)
        .send({ name: "Updated Intern", notes: "Updated notes" });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: internId,
        name: "Updated Intern",
        notes: "Updated notes",
        email: "intern@example.com",
      });
    });

    it("DELETE /api/interns/:id should delete an intern", async () => {
      const postResponse = await request(app)
        .post("/api/interns")
        .send({ name: "Test Intern" });
      const internId = postResponse.body.id;

      const response = await request(app).delete(`/api/interns/${internId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const getResponse = await request(app).get("/api/interns");
      expect(getResponse.body).toEqual([]);
    });
  });

  describe("Categories API", () => {
    it("GET /api/categories should return empty array initially", async () => {
      const response = await request(app).get("/api/categories");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("POST /api/categories should create a new category", async () => {
      const newCategory = { name: "Test Category", subcategories: [] };
      const response = await request(app)
        .post("/api/categories")
        .send(newCategory);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...newCategory,
        createdAt: expect.any(String),
      });
    });

    it("PUT /api/categories/:id should update a category", async () => {
      const postResponse = await request(app)
        .post("/api/categories")
        .send({ name: "Original Category", subcategories: [] });
      const categoryId = postResponse.body.id;

      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .send({ name: "Updated Category" });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const getResponse = await request(app).get("/api/categories");
      expect(getResponse.body[0]).toMatchObject({
        id: categoryId,
        name: "Updated Category",
        subcategories: [],
        updatedAt: expect.any(String),
      });
    });

    it("DELETE /api/categories/:id should delete a category", async () => {
      const postResponse = await request(app)
        .post("/api/categories")
        .send({ name: "Test Category", subcategories: [] });
      const categoryId = postResponse.body.id;

      const response = await request(app).delete(
        `/api/categories/${categoryId}`,
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const getResponse = await request(app).get("/api/categories");
      expect(getResponse.body).toEqual([]);
    });
  });

  describe("Tasks API", () => {
    const file = "test-tasks.json";

    it("GET /api/tasks should return empty array initially", async () => {
      const response = await request(app).get(`/api/tasks?file=${file}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("POST /api/tasks should create a task with status_dates", async () => {
      const response = await request(app)
        .post(`/api/tasks?file=${file}`)
        .send({ title: "Test Task", status: "todo" });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: "Test Task",
        status: "todo",
        created_date: expect.any(String),
        updated_date: expect.any(String),
      });
      expect(response.body.status_dates).toHaveProperty("todo");
    });

    it("PUT /api/tasks/:id should record a new status date on change", async () => {
      const created = await request(app)
        .post(`/api/tasks?file=${file}`)
        .send({ title: "Task", status: "todo" });
      const id = created.body.id;

      const response = await request(app)
        .put(`/api/tasks/${id}?file=${file}`)
        .send({ status: "done" });
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("done");
      expect(response.body.status_dates).toHaveProperty("todo");
      expect(response.body.status_dates).toHaveProperty("done");
    });

    it("DELETE /api/tasks/:id should remove the task and its children", async () => {
      const parent = await request(app)
        .post(`/api/tasks?file=${file}`)
        .send({ title: "Parent" });
      const child = await request(app)
        .post(`/api/tasks?file=${file}`)
        .send({ title: "Child", parent_id: parent.body.id });

      const response = await request(app).delete(
        `/api/tasks/${parent.body.id}?file=${file}`,
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const remaining = await request(app).get(`/api/tasks?file=${file}`);
      const ids = remaining.body.map((t) => t.id);
      expect(ids).not.toContain(parent.body.id);
      expect(ids).not.toContain(child.body.id);
    });
  });

  describe("Task Files API", () => {
    it("GET /api/task-files should list json files", async () => {
      // Create a task in a new file so it shows up.
      await request(app)
        .post("/api/tasks?file=listing-test.json")
        .send({ title: "x" });
      const response = await request(app).get("/api/task-files");
      expect(response.status).toBe(200);
      expect(response.body).toContain("listing-test.json");
    });

    it("POST /api/task-files/upload should reject non-json structure", async () => {
      const response = await request(app)
        .post("/api/task-files/upload")
        .attach("file", Buffer.from(JSON.stringify({ nope: true })), "bad.json");
      expect(response.status).toBe(400);
    });

    it("POST /api/task-files/upload should accept a valid task file", async () => {
      const response = await request(app)
        .post("/api/task-files/upload")
        .attach(
          "file",
          Buffer.from(JSON.stringify({ tasks: [] })),
          "good.json",
        );
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        filename: expect.any(String),
      });
    });
  });
});
