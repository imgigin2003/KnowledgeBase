const API_BASE = "/api";

export const Task = {
  list: async (sortParam = "-created_date", filename = "reminders.json") => {
    const res = await fetch(
      `${API_BASE}/tasks?_sort=${sortParam.substring(1)}&_order=${
        sortParam.startsWith("-") ? "desc" : "asc"
      }&file=${encodeURIComponent(filename)}`
    );
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return await res.json();
  },
  create: async (data, filename = "reminders.json") => {
    const res = await fetch(
      `${API_BASE}/tasks?file=${encodeURIComponent(filename)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },
  update: async (id, data, filename = "reminders.json") => {
    const res = await fetch(
      `${API_BASE}/tasks/${id}?file=${encodeURIComponent(filename)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
  },
  delete: async (id, filename = "reminders.json") => {
    const res = await fetch(
      `${API_BASE}/tasks/${id}?file=${encodeURIComponent(filename)}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) throw new Error("Failed to delete task");
    return { success: true };
  },
  get: async (id, filename = "reminders.json") => {
    const res = await fetch(
      `${API_BASE}/tasks/${id}?file=${encodeURIComponent(filename)}`
    );
    if (!res.ok) throw new Error("Failed to fetch task");
    return res.json();
  },
  getTaskFiles: async () => {
    const res = await fetch(`${API_BASE}/task-files`);
    if (!res.ok) throw new Error("Failed to fetch task files");
    return res.json();
  },
  uploadTaskFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/task-files/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to upload task file");
    }
    return res.json();
  },
};

export default Task;
