import fs from "fs";
import path from "path";
import { TASK_FILES_DIR } from "../config.js";

export async function listTaskFiles(req, res) {
  try {
    const files = fs.readdirSync(TASK_FILES_DIR);
    res.json(files.filter((f) => f.endsWith(".json")));
  } catch {
    res.status(500).json({ error: "Failed to read task files" });
  }
}

export async function uploadTaskFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedFilePath = req.file.path;
    const fileContent = fs.readFileSync(uploadedFilePath, "utf-8");

    // Validate JSON.
    let jsonData;
    try {
      jsonData = JSON.parse(fileContent);
    } catch {
      fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({ error: "Invalid JSON file" });
    }

    // Validate structure.
    if (!jsonData.tasks || !Array.isArray(jsonData.tasks)) {
      fs.unlinkSync(uploadedFilePath);
      return res
        .status(400)
        .json({ error: "Invalid task file structure. Expected { tasks: [] }" });
    }

    // Give the file a unique, sanitized name.
    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFilename = `tasks-${timestamp}-${originalName}`;
    const newFilePath = path.join(TASK_FILES_DIR, newFilename);

    fs.renameSync(uploadedFilePath, newFilePath);

    res.json({ filename: newFilename, success: true });
  } catch (error) {
    console.error("Error uploading task file:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to upload task file" });
  }
}
