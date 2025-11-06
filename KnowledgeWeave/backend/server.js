import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { Low } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// task-files directory (all JSON task files live here)
const taskDataDir = path.join(__dirname, "task-files");
if (!fs.existsSync(taskDataDir)) {
  fs.mkdirSync(taskDataDir, { recursive: true });
}

// Multer: save directly into task-files (no subfolder)
const upload = multer({
  dest: taskDataDir,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".json") {
      return cb(new Error("Only .json files allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// DB setup
const articlesPath = path.join(__dirname, "articles.json");
const internsPath = path.join(__dirname, "interns.json");
const categoriesPath = path.join(__dirname, "categories.json");
const remindersPath = path.join(taskDataDir, "reminders.json");

const articlesAdapter = new JSONFileSync(articlesPath);
const articlesDb = new Low(articlesAdapter, { articles: [] });

const internsAdapter = new JSONFileSync(internsPath);
const internsDb = new Low(internsAdapter, { interns: [] });

const categoriesAdapter = new JSONFileSync(categoriesPath);
const categoriesDb = new Low(categoriesAdapter, { categories: [] });

const remindersAdapter = new JSONFileSync(remindersPath);
const remindersDb = new Low(remindersAdapter, { tasks: [] });

const taskDatabases = new Map();

function getTaskDb(filename) {
  if (!taskDatabases.has(filename)) {
    const filePath = path.join(taskDataDir, filename);
    const adapter = new JSONFileSync(filePath);
    const db = new Low(adapter, { tasks: [] });
    taskDatabases.set(filename, db);
  }
  return taskDatabases.get(filename);
}

async function initDB() {
  await articlesDb.read();
  articlesDb.data ||= { articles: [] };
  await internsDb.read();
  internsDb.data ||= { interns: [] };
  await categoriesDb.read();
  categoriesDb.data ||= { categories: [] };
  await remindersDb.read();
  remindersDb.data ||= { tasks: [] };

  // Populate categories from articles if empty
  if (categoriesDb.data.categories.length === 0) {
    const categoryMap = new Map();
    articlesDb.data.articles.forEach((article) => {
      (article.categories || [article.category || "uncategorized"]).forEach(
        (cat) => {
          const parts = cat.split("/").filter(Boolean);
          let level = categoryMap;
          parts.forEach((part, i) => {
            if (!level.has(part)) {
              level.set(part, {
                id: `${article.id}-${i + 1}`,
                name: part,
                subcategories: new Map(),
                createdAt: article.createdAt,
              });
            }
            level = level.get(part).subcategories;
          });
        }
      );
    });

    const toArray = (map) =>
      Array.from(map.values()).map((c) => ({
        ...c,
        subcategories: toArray(c.subcategories),
      }));

    categoriesDb.data.categories = toArray(categoryMap);
    await categoriesDb.write();
  }
}

/* -------------------------------------------------------------------------- */
/*                               TASK FILE UPLOAD                             */
/* -------------------------------------------------------------------------- */
app.post("/api/task-files/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const tempPath = req.file.path;
    const originalName = req.file.originalname;

    // Validate JSON
    let jsonData;
    try {
      jsonData = JSON.parse(fs.readFileSync(tempPath, "utf-8"));
    } catch {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "Invalid JSON file" });
    }

    if (!jsonData.tasks || !Array.isArray(jsonData.tasks)) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "Expected { tasks: [] }" });
    }

    // Final filename (handle duplicates)
    let finalName = originalName;
    let finalPath = path.join(taskDataDir, finalName);
    if (fs.existsSync(finalPath)) {
      const parsed = path.parse(originalName);
      finalName = `${parsed.name}-${Date.now()}${parsed.ext}`;
      finalPath = path.join(taskDataDir, finalName);
    }

    // Move/rename to final location
    if (tempPath !== finalPath) {
      fs.renameSync(tempPath, finalPath);
    }

    res.json({ filename: finalName, success: true });
  } catch (err) {
    console.error("Upload error:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

/* -------------------------------------------------------------------------- */
/*                               LIST TASK FILES                              */
/* -------------------------------------------------------------------------- */
app.get("/api/task-files", (req, res) => {
  try {
    const files = fs.readdirSync(taskDataDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    res.json(jsonFiles);
  } catch {
    res.status(500).json({ error: "Failed to read task files" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                   TASK CRUD                                */
/* -------------------------------------------------------------------------- */
app.get("/api/tasks", async (req, res) => {
  const filename = req.query.file || "reminders.json";
  const db = getTaskDb(filename);
  try {
    await db.read();
    let tasks = db.data?.tasks || [];
    const sort = req.query._sort;
    const order = req.query._order === "desc" ? -1 : 1;
    if (sort) {
      tasks.sort((a, b) =>
        a[sort] < b[sort] ? -order : a[sort] > b[sort] ? order : 0
      );
    }
    res.json(tasks);
  } catch {
    res.status(500).json({ error: "Failed to read tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  const filename = req.query.file || "reminders.json";
  const db = getTaskDb(filename);
  try {
    await db.read();
    const task = {
      id: Date.now().toString(),
      ...req.body,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    db.data.tasks = db.data.tasks || [];
    db.data.tasks.push(task);
    await db.write();
    res.json(task);
  } catch {
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  const filename = req.query.file || "reminders.json";
  const db = getTaskDb(filename);
  try {
    await db.read();
    const idx = db.data.tasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Task not found" });
    db.data.tasks[idx] = {
      ...db.data.tasks[idx],
      ...req.body,
      updated_date: new Date().toISOString(),
    };
    await db.write();
    res.json(db.data.tasks[idx]);
  } catch {
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const filename = req.query.file || "reminders.json";
  const db = getTaskDb(filename);
  try {
    await db.read();
    const toDelete = new Set([req.params.id]);
    const collect = (pid) =>
      db.data.tasks.forEach((t) => {
        if (t.parent_id === pid) {
          toDelete.add(t.id);
          collect(t.id);
        }
      });
    collect(req.params.id);
    db.data.tasks = db.data.tasks.filter((t) => !toDelete.has(t.id));
    await db.write();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

app.get("/api/tasks/:id", async (req, res) => {
  const filename = req.query.file || "reminders.json";
  const db = getTaskDb(filename);
  try {
    await db.read();
    const task = db.data.tasks.find((t) => t.id === req.params.id);
    task ? res.json(task) : res.status(404).json({ error: "Not found" });
  } catch {
    res.status(500).json({ error: "Failed to get task" });
  }
});

/* -------------------------------------------------------------------------- */
/*                               ARTICLES, INTERNS, CATEGORIES                */
/* -------------------------------------------------------------------------- */
// (unchanged – keep your original routes here)
app.get("/api/articles", async (req, res) => {
  await articlesDb.read();
  res.json(articlesDb.data.articles || []);
});
app.post("/api/articles", async (req, res) => {
  await articlesDb.read();
  const a = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  articlesDb.data.articles.push(a);
  await articlesDb.write();
  res.json(a);
});
app.put("/api/articles/:id", async (req, res) => {
  await articlesDb.read();
  const idx = articlesDb.data.articles.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  articlesDb.data.articles[idx] = {
    ...articlesDb.data.articles[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  await articlesDb.write();
  res.json(articlesDb.data.articles[idx]);
});
app.delete("/api/articles/:id", async (req, res) => {
  await articlesDb.read();
  articlesDb.data.articles = articlesDb.data.articles.filter(
    (a) => a.id !== req.params.id
  );
  await articlesDb.write();
  res.json({ success: true });
});
app.get("/api/articles/:id", async (req, res) => {
  await articlesDb.read();
  const a = articlesDb.data.articles.find((a) => a.id === req.params.id);
  a ? res.json(a) : res.status(404).json({ error: "Not found" });
});
app.post("/api/articles/:id/comments", async (req, res) => {
  await articlesDb.read();
  const idx = articlesDb.data.articles.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const c = {
    id: Date.now().toString() + Math.random(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  articlesDb.data.articles[idx].comments =
    articlesDb.data.articles[idx].comments || [];
  articlesDb.data.articles[idx].comments.push(c);
  await articlesDb.write();
  res.json(articlesDb.data.articles[idx]);
});
app.put("/api/articles/:aid/comments/:cid", async (req, res) => {
  await articlesDb.read();
  const aIdx = articlesDb.data.articles.findIndex(
    (a) => a.id === req.params.aid
  );
  if (aIdx === -1) return res.status(404).json({ error: "Article not found" });
  const cIdx = articlesDb.data.articles[aIdx].comments?.findIndex(
    (c) => c.id === req.params.cid
  );
  if (cIdx === -1) return res.status(404).json({ error: "Comment not found" });
  articlesDb.data.articles[aIdx].comments[cIdx] = {
    ...articlesDb.data.articles[aIdx].comments[cIdx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  await articlesDb.write();
  res.json(articlesDb.data.articles[aIdx].comments[cIdx]);
});
app.delete("/api/articles/:aid/comments/:cid", async (req, res) => {
  await articlesDb.read();
  const aIdx = articlesDb.data.articles.findIndex(
    (a) => a.id === req.params.aid
  );
  if (aIdx === -1) return res.status(404).json({ error: "Article not found" });
  const initial = articlesDb.data.articles[aIdx].comments?.length || 0;
  articlesDb.data.articles[aIdx].comments =
    articlesDb.data.articles[aIdx].comments?.filter(
      (c) => c.id !== req.params.cid
    ) || [];
  if (articlesDb.data.articles[aIdx].comments.length === initial)
    return res.status(404).json({ error: "Comment not found" });
  await articlesDb.write();
  res.json({ success: true });
});

app.get("/api/interns", async (req, res) => {
  await internsDb.read();
  res.json(internsDb.data.interns || []);
});
app.post("/api/interns", async (req, res) => {
  await internsDb.read();
  const i = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  internsDb.data.interns.push(i);
  await internsDb.write();
  res.json(i);
});
app.put("/api/interns/:id", async (req, res) => {
  await internsDb.read();
  const idx = internsDb.data.interns.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  internsDb.data.interns[idx] = { ...internsDb.data.interns[idx], ...req.body };
  await internsDb.write();
  res.json(internsDb.data.interns[idx]);
});
app.delete("/api/interns/:id", async (req, res) => {
  await internsDb.read();
  internsDb.data.interns = internsDb.data.interns.filter(
    (i) => i.id !== req.params.id
  );
  await internsDb.write();
  res.json({ success: true });
});
app.get("/api/interns/:id", async (req, res) => {
  await internsDb.read();
  const i = internsDb.data.interns.find((i) => i.id === req.params.id);
  i ? res.json(i) : res.status(404).json({ error: "Not found" });
});

app.get("/api/categories", async (req, res) => {
  await categoriesDb.read();
  res.json(categoriesDb.data.categories || []);
});
app.post("/api/categories", async (req, res) => {
  await categoriesDb.read();
  const c = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  categoriesDb.data.categories.push(c);
  await categoriesDb.write();
  res.json(c);
});
app.put("/api/categories/:id", async (req, res) => {
  await categoriesDb.read();
  const update = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === req.params.id) {
        nodes[i] = {
          ...nodes[i],
          ...req.body,
          updatedAt: new Date().toISOString(),
        };
        return true;
      }
      if (nodes[i].subcategories && update(nodes[i].subcategories)) return true;
    }
    return false;
  };
  update(categoriesDb.data.categories)
    ? (await categoriesDb.write(), res.json({ success: true }))
    : res.status(404).json({ error: "Not found" });
});
app.delete("/api/categories/:id", async (req, res) => {
  await categoriesDb.read();
  categoriesDb.data.categories = categoriesDb.data.categories.filter(
    (c) => c.id !== req.params.id
  );
  await categoriesDb.write();
  res.json({ success: true });
});

/* -------------------------------------------------------------------------- */
/*                               SERVE FRONTEND                               */
/* -------------------------------------------------------------------------- */
app.use(express.static(path.join(__dirname, "../dist")));
app.get("/*", (req, res) =>
  res.sendFile(path.join(__dirname, "../dist/index.html"))
);

/* -------------------------------------------------------------------------- */
/*                                   STARTUP                                  */
/* -------------------------------------------------------------------------- */
initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
