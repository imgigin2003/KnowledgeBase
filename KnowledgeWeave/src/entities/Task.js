const API_BASE = "/api";

export const Task = {
  list: async (sortParam = "-created_date") => {
    // Added sortParam as tasks will need it for initial sort
    const res = await fetch(
      `${API_BASE}/tasks?_sort=${sortParam.substring(1)}&_order=${
        sortParam.startsWith("-") ? "desc" : "asc"
      }`
    );
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return await res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete task");
    return { success: true };
  },
  get: async (id) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error("Failed to fetch task");
    return res.json();
  },
};

export default Task;
