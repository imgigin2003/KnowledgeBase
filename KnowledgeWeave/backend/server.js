const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Paths to JSON files in backend
const articlesPath = path.join(__dirname, "articles.json");
const internsPath = path.join(__dirname, "interns.json");
const categoriesPath = path.join(__dirname, "categories.json");

const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

// DB Setup
const articlesAdapter = new JSONFile(articlesPath);
const articlesDb = new Low(articlesAdapter, { articles: [] });

const internsAdapter = new JSONFile(internsPath);
const internsDb = new Low(internsAdapter, { interns: [] });

const categoriesAdapter = new JSONFile(categoriesPath);
const categoriesDb = new Low(categoriesAdapter, { categories: [] });

async function initDB() {
  await articlesDb.read();
  articlesDb.data ||= { articles: [] };

  await internsDb.read();
  internsDb.data ||= { interns: [] };

  await categoriesDb.read();
  categoriesDb.data ||= { categories: [] };

  // Initialize categories from articles if categories.json is empty
  if (categoriesDb.data.categories.length === 0) {
    const categoryMap = new Map();
    articlesDb.data.articles.forEach((article) => {
      (article.categories || [article.category || "uncategorized"]).forEach(
        (cat) => {
          const parts = cat.split("/").filter(Boolean);
          let currentLevel = categoryMap;
          let currentPath = "";

          parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (!currentLevel.has(part)) {
              const category = {
                id: `${article.id}-${index + 1}`,
                name: part,
                subcategories: new Map(),
                createdAt: article.createdAt,
              };
              currentLevel.set(part, category);
            }
            currentLevel = currentLevel.get(part).subcategories;
          });
        }
      );
    });

    // Convert Map to array
    const convertMapToArray = (map) => {
      return Array.from(map.values()).map((cat) => ({
        ...cat,
        subcategories: convertMapToArray(cat.subcategories),
      }));
    };

    categoriesDb.data.categories = convertMapToArray(categoryMap);
    await categoriesDb.write();
  }
}

// API Routes for Articles
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

// API Routes for Interns
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

// API Routes for Categories
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
  const index = categoriesDb.data.categories.findIndex((c) => c.id === id);
  if (index !== -1) {
    categoriesDb.data.categories[index] = {
      ...categoriesDb.data.categories[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    await categoriesDb.write();
    res.json(categoriesDb.data.categories[index]);
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

// Serve static Vite build (frontend)
app.use(express.static(path.join(__dirname, "../dist")));

app.use("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
