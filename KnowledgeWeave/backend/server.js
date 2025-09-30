const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Path به JSON در backend
const articlesPath = path.join(__dirname, "articles.json");
const internsPath = path.join(__dirname, "interns.json");

const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

// DB Setup
const articlesAdapter = new JSONFile(articlesPath);
const articlesDb = new Low(articlesAdapter, { articles: [] });

const internsAdapter = new JSONFile(internsPath);
const internsDb = new Low(internsAdapter, { interns: [] });

async function initDB() {
  await articlesDb.read();
  articlesDb.data ||= { articles: [] };

  await internsDb.read();
  internsDb.data ||= { interns: [] };
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
