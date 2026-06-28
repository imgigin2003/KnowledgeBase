import path from "path";
import multer from "multer";
import { TASK_FILES_DIR, MAX_UPLOAD_BYTES } from "../config.js";

// Multer: save uploads directly into the task-files directory, JSON only.
export const upload = multer({
  dest: TASK_FILES_DIR,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".json") {
      return cb(new Error("Only .json files allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_UPLOAD_BYTES },
});
