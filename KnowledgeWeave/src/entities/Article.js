const API_BASE = "/api";

export const Article = {
  list: async () => {
    const res = await fetch(`${API_BASE}/articles`);
    if (!res.ok) throw new Error("Failed to fetch articles");
    return res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create article");
    return res.json();
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update article");
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete article");
    return { success: true };
  },
  get: async (id) => {
    const res = await fetch(`${API_BASE}/articles/${id}`);
    if (!res.ok) throw new Error("Failed to fetch article");
    return res.json();
  },
};

export default Article;
