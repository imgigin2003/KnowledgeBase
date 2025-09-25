const API_BASE = "/api";

export const Intern = {
  list: async () => {
    const res = await fetch(`${API_BASE}/interns`);
    if (!res.ok) throw new Error("Failed to fetch interns");
    return await res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE}/interns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create intern");
    return res.json();
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE}/interns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update intern");
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/interns/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete intern");
    return { success: true };
  },
  get: async (id) => {
    const res = await fetch(`${API_BASE}/interns/${id}`);
    if (!res.ok) throw new Error("Failed to fetch intern");
    return res.json();
  },
};

export default Intern;
