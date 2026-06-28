const API_BASE = "/api";

export const Categories = {
  list: async () => {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },
  create: async (category) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
  },
  update: async (id, category) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete category");
    return res.json();
  },
};

export default Categories;
