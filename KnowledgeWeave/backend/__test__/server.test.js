import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs-extra";
import { Low } from "lowdb";
import { JSONFileSync } from "lowdb/node";

// Emulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the server setup
const app = express();
app.use(cors());
app.use(express.json());

// Setup temporary JSON files for testing
const testDir = path.join(__dirname, "test-data");
const articlesPath = path.join(testDir, "articles.json");
const internsPath = path.join(testDir, "interns.json");
const categoriesPath = path.join(testDir, "categories.json");

// Initialize databases
const articlesAdapter = new JSONFileSync(articlesPath);
const articlesDb = new Low(articlesAdapter, { articles: [] });

const internsAdapter = new JSONFileSync(internsPath);
const internsDb = new Low(internsAdapter, { interns: [] });

const categoriesAdapter = new JSONFileSync(categoriesPath);
const categoriesDb = new Low(categoriesAdapter, { categories: [] });

// Copy server routes
app.get("/api/articles", async (req, res) => {
  await articlesDb.read();
  res.json(articlesDb.data?.articles || []);
});

app.post("/api/articles", async (req, res) => {
  await articlesDb.read();
  const newArticle = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  articlesDb.data.articles.push(newArticle);
  await articlesDb.write();
  res.json(newArticle);
});

app.put("/api/articles/:id", async (req, res) => {
  await articlesDb.read();
  const id = req.params.id;
  const index = articlesDb.data.articles.findIndex((a) => a.id === id);
  if (index !== -1) {
    articlesDb.data.articles[index] = {
      ...articlesDb.data.articles[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    await articlesDb.write();
    res.json(articlesDb.data.articles[index]);
  } else {
    res.status(404).json({ error: "Article not found" });
  }
});

app.delete("/api/articles/:id", async (req, res) => {
  await articlesDb.read();
  const id = req.params.id;
  articlesDb.data.articles = articlesDb.data.articles.filter(
    (a) => a.id !== id
  );
  await articlesDb.write();
  res.json({ success: true });
});

app.get("/api/articles/:id", async (req, res) => {
  await articlesDb.read();
  const id = req.params.id;
  const article = articlesDb.data.articles.find((a) => a.id === id);
  if (article) res.json(article);
  else res.status(404).json({ error: "Not found" });
});

app.post("/api/articles/:id/comments", async (req, res) => {
  await articlesDb.read();
  const id = req.params.id;
  const articleIndex = articlesDb.data.articles.findIndex((a) => a.id === id);
  if (articleIndex === -1)
    return res.status(404).json({ error: "Article not found" });

  const newComment = {
    id: Date.now().toString() + Math.random(),
    name: req.body.name,
    email: req.body.email || null,
    content: req.body.content,
    createdAt: new Date().toISOString(),
  };

  if (!articlesDb.data.articles[articleIndex].comments) {
    articlesDb.data.articles[articleIndex].comments = [];
  }
  articlesDb.data.articles[articleIndex].comments.push(newComment);
  await articlesDb.write();
  res.json(articlesDb.data.articles[articleIndex]);
});

app.get("/api/interns", async (req, res) => {
  await internsDb.read();
  res.json(internsDb.data?.interns || []);
});

app.post("/api/interns", async (req, res) => {
  await internsDb.read();
  const newIntern = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  internsDb.data.interns.push(newIntern);
  await internsDb.write();
  res.json(newIntern);
});

app.put("/api/interns/:id", async (req, res) => {
  await internsDb.read();
  const id = req.params.id;
  const index = internsDb.data.interns.findIndex((i) => i.id === id);
  if (index !== -1) {
    internsDb.data.interns[index] = {
      ...internsDb.data.interns[index],
      ...req.body,
    };
    await internsDb.write();
    res.json(internsDb.data.interns[index]);
  } else {
    res.status(404).json({ error: "Intern not found" });
  }
});

app.delete("/api/interns/:id", async (req, res) => {
  await internsDb.read();
  const id = req.params.id;
  internsDb.data.interns = internsDb.data.interns.filter((i) => i.id !== id);
  await internsDb.write();
  res.json({ success: true });
});

app.get("/api/interns/:id", async (req, res) => {
  await internsDb.read();
  const id = req.params.id;
  const intern = internsDb.data.interns.find((i) => i.id === id);
  if (intern) res.json(intern);
  else res.status(404).json({ error: "Not found" });
});

app.get("/api/categories", async (req, res) => {
  await categoriesDb.read();
  res.json(categoriesDb.data?.categories || []);
});

app.post("/api/categories", async (req, res) => {
  await categoriesDb.read();
  const newCategory = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  categoriesDb.data.categories.push(newCategory);
  await categoriesDb.write();
  res.json(newCategory);
});

app.put("/api/categories/:id", async (req, res) => {
  await categoriesDb.read();
  const id = req.params.id;
  const updateRecursive = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        nodes[i] = {
          ...nodes[i],
          ...req.body,
          updatedAt: new Date().toISOString(),
        };
        return true;
      }
      if (nodes[i].subcategories && updateRecursive(nodes[i].subcategories))
        return true;
    }
    return false;
  };

  const updated = updateRecursive(categoriesDb.data.categories);
  if (updated) {
    await categoriesDb.write();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Category not found" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  await categoriesDb.read();
  const id = req.params.id;
  categoriesDb.data.categories = categoriesDb.data.categories.filter(
    (c) => c.id !== id
  );
  await categoriesDb.write();
  res.json({ success: true });
});

// Test suite
describe("Knowledge Base API", () => {
  beforeAll(async () => {
    // Ensure test directory exists and is empty
    await fs.ensureDir(testDir);
    await fs.emptyDir(testDir);

    // Initialize empty JSON files
    await fs.writeJson(articlesPath, { articles: [] });
    await fs.writeJson(internsPath, { interns: [] });
    await fs.writeJson(categoriesPath, { categories: [] });
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  beforeEach(async () => {
    // Reset data before each test
    await fs.writeJson(articlesPath, { articles: [] });
    await fs.writeJson(internsPath, { interns: [] });
    await fs.writeJson(categoriesPath, { categories: [] });
  });

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
      const response = await request(app)
        .post("/api/articles")
        .send(newArticle);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...newArticle,
        createdAt: expect.any(String),
      });
    });

    it("PUT /api/articles/:id should update an article", async () => {
      // Create an article
      const newArticle = {
        title: "Original Title",
        content: "Original content",
        summary: "Original summary",
        author: "Test Author",
        category: "test",
        status: "draft",
        priority: "low",
        tags: ["test"],
        categories: ["test"],
      };
      const postResponse = await request(app)
        .post("/api/articles")
        .send(newArticle);
      const articleId = postResponse.body.id;

      // Update the article
      const updatedArticle = {
        title: "Updated Title",
        content: "Updated content",
      };
      const response = await request(app)
        .put(`/api/articles/${articleId}`)
        .send(updatedArticle);
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
      // Create an article
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
      const postResponse = await request(app)
        .post("/api/articles")
        .send(newArticle);
      const articleId = postResponse.body.id;

      // Delete the article
      const response = await request(app).delete(`/api/articles/${articleId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify deletion
      const getResponse = await request(app).get("/api/articles");
      expect(getResponse.body).toEqual([]);
    });

    it("POST /api/articles/:id/comments should add a comment", async () => {
      // Create an article
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
      const postResponse = await request(app)
        .post("/api/articles")
        .send(newArticle);
      const articleId = postResponse.body.id;

      // Add a comment
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
        start_date: "2025-10-01",
        program: "Test Program",
        mentor: "Test Mentor",
        status: "active",
        requirements: [],
        notes: "Test notes",
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
      // Create an intern
      const newIntern = {
        name: "Original Intern",
        email: "intern@example.com",
        start_date: "2025-10-01",
        program: "Test Program",
        mentor: "Test Mentor",
        status: "active",
        requirements: [],
        notes: "Original notes",
      };
      const postResponse = await request(app)
        .post("/api/interns")
        .send(newIntern);
      const internId = postResponse.body.id;

      // Update the intern
      const updatedIntern = {
        name: "Updated Intern",
        notes: "Updated notes",
      };
      const response = await request(app)
        .put(`/api/interns/${internId}`)
        .send(updatedIntern);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: internId,
        name: "Updated Intern",
        notes: "Updated notes",
        email: "intern@example.com",
      });
    });

    it("DELETE /api/interns/:id should delete an intern", async () => {
      // Create an intern
      const newIntern = {
        name: "Test Intern",
        email: "intern@example.com",
        start_date: "2025-10-01",
        program: "Test Program",
        mentor: "Test Mentor",
        status: "active",
        requirements: [],
        notes: "Test notes",
      };
      const postResponse = await request(app)
        .post("/api/interns")
        .send(newIntern);
      const internId = postResponse.body.id;

      // Delete the intern
      const response = await request(app).delete(`/api/interns/${internId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify deletion
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
      const newCategory = {
        name: "Test Category",
        subcategories: [],
      };
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
      // Create a category
      const newCategory = {
        name: "Original Category",
        subcategories: [],
      };
      const postResponse = await request(app)
        .post("/api/categories")
        .send(newCategory);
      const categoryId = postResponse.body.id;

      // Update the category
      const updatedCategory = {
        name: "Updated Category",
      };
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .send(updatedCategory);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify update
      const getResponse = await request(app).get("/api/categories");
      expect(getResponse.body[0]).toMatchObject({
        id: categoryId,
        name: "Updated Category",
        subcategories: [],
        updatedAt: expect.any(String),
      });
    });

    it("DELETE /api/categories/:id should delete a category", async () => {
      // Create a category
      const newCategory = {
        name: "Test Category",
        subcategories: [],
      };
      const postResponse = await request(app)
        .post("/api/categories")
        .send(newCategory);
      const categoryId = postResponse.body.id;

      // Delete the category
      const response = await request(app).delete(
        `/api/categories/${categoryId}`
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify deletion
      const getResponse = await request(app).get("/api/categories");
      expect(getResponse.body).toEqual([]);
    });
  });
});
