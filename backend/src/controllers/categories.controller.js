import { categoriesDb } from "../db/index.js";

export async function listCategories(req, res) {
  await categoriesDb.read();
  res.json(categoriesDb.data.categories || []);
}

export async function createCategory(req, res) {
  await categoriesDb.read();
  const category = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  categoriesDb.data.categories.push(category);
  await categoriesDb.write();
  res.json(category);
}

export async function updateCategory(req, res) {
  await categoriesDb.read();

  // Categories are nested, so search the tree recursively.
  const updateRecursive = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === req.params.id) {
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

  if (!updateRecursive(categoriesDb.data.categories)) {
    return res.status(404).json({ error: "Not found" });
  }
  await categoriesDb.write();
  res.json({ success: true });
}

export async function deleteCategory(req, res) {
  await categoriesDb.read();
  categoriesDb.data.categories = categoriesDb.data.categories.filter(
    (c) => c.id !== req.params.id,
  );
  await categoriesDb.write();
  res.json({ success: true });
}
