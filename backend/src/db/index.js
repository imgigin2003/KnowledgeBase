import fs from "fs";
import path from "path";
import { Low } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import { DATA_DIR, TASK_FILES_DIR, DEFAULT_TASK_FILE } from "../config.js";

// Ensure the data directories exist before any adapter touches the disk.
fs.mkdirSync(TASK_FILES_DIR, { recursive: true });

const createDb = (filePath, defaultData) =>
  new Low(new JSONFileSync(filePath), defaultData);

export const articlesDb = createDb(path.join(DATA_DIR, "articles.json"), {
  articles: [],
});
export const internsDb = createDb(path.join(DATA_DIR, "interns.json"), {
  interns: [],
});
export const categoriesDb = createDb(path.join(DATA_DIR, "categories.json"), {
  categories: [],
});

// Each task file gets its own lazily-created lowdb instance, cached by name.
const taskDatabases = new Map();

export function getTaskDb(filename = DEFAULT_TASK_FILE) {
  if (!taskDatabases.has(filename)) {
    const filePath = path.join(TASK_FILES_DIR, filename);
    taskDatabases.set(filePath, createDb(filePath, { tasks: [] }));
    taskDatabases.set(filename, taskDatabases.get(filePath));
  }
  return taskDatabases.get(filename);
}

// Build a nested category tree from the existing articles (one-time seed).
function seedCategoriesFromArticles() {
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
      },
    );
  });

  const toArray = (map) =>
    Array.from(map.values()).map((c) => ({
      ...c,
      subcategories: toArray(c.subcategories),
    }));

  return toArray(categoryMap);
}

export async function initDB() {
  await articlesDb.read();
  articlesDb.data ||= { articles: [] };

  await internsDb.read();
  internsDb.data ||= { interns: [] };

  await categoriesDb.read();
  categoriesDb.data ||= { categories: [] };

  // Ensure the default task file exists.
  const reminders = getTaskDb(DEFAULT_TASK_FILE);
  await reminders.read();
  reminders.data ||= { tasks: [] };
  await reminders.write();

  // Populate categories from articles if empty.
  if (categoriesDb.data.categories.length === 0) {
    categoriesDb.data.categories = seedCategoriesFromArticles();
    await categoriesDb.write();
  }
}
