import { getTaskDb } from "../db/index.js";
import { DEFAULT_TASK_FILE } from "../config.js";

const fileFrom = (req) => req.query.file || DEFAULT_TASK_FILE;

export async function listTasks(req, res) {
  const db = getTaskDb(fileFrom(req));
  try {
    await db.read();
    const tasks = db.data?.tasks || [];

    const sortBy = req.query._sort;
    const order = req.query._order === "desc" ? -1 : 1;
    if (sortBy) {
      tasks.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1 * order;
        if (a[sortBy] > b[sortBy]) return 1 * order;
        return 0;
      });
    }

    res.json(tasks);
  } catch (error) {
    console.error("Error reading tasks:", error);
    res.status(500).json({ error: "Failed to read tasks" });
  }
}

export async function getTask(req, res) {
  const db = getTaskDb(fileFrom(req));
  try {
    await db.read();
    const task = db.data.tasks.find((t) => t.id === req.params.id);
    task ? res.json(task) : res.status(404).json({ error: "Not found" });
  } catch {
    res.status(500).json({ error: "Failed to get task" });
  }
}

export async function createTask(req, res) {
  const db = getTaskDb(fileFrom(req));
  try {
    await db.read();
    const now = new Date().toISOString();
    const task = {
      id: Date.now().toString(),
      ...req.body,
      created_date: now,
      updated_date: now,
      status_dates: {
        [req.body.status || "created"]: now,
      },
    };
    db.data.tasks = db.data.tasks || [];
    db.data.tasks.push(task);
    await db.write();
    res.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res
      .status(500)
      .json({ error: "Failed to create task", details: error.message });
  }
}

export async function updateTask(req, res) {
  const db = getTaskDb(fileFrom(req));
  try {
    await db.read();
    const idx = db.data.tasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Task not found" });

    const oldTask = db.data.tasks[idx];
    const now = new Date().toISOString();

    // Record the timestamp whenever the status transitions to a new value.
    const newStatusDates = { ...oldTask.status_dates };
    if (req.body.status && req.body.status !== oldTask.status) {
      newStatusDates[req.body.status] = now;
    }

    db.data.tasks[idx] = {
      ...oldTask,
      ...req.body,
      updated_date: now,
      status_dates: newStatusDates,
    };
    await db.write();
    res.json(db.data.tasks[idx]);
  } catch (error) {
    console.error("Error updating task:", error);
    res
      .status(500)
      .json({ error: "Failed to update task", details: error.message });
  }
}

export async function deleteTask(req, res) {
  const db = getTaskDb(fileFrom(req));
  try {
    await db.read();

    // Delete the task and all of its descendants.
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
}
