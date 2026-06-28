import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PORT = process.env.PORT || 3001;

// Where the JSON "databases" live. Override with DATA_DIR (used by tests/Docker).
export const DATA_DIR =
  process.env.DATA_DIR || path.resolve(__dirname, "../data");

// Uploaded task files live in their own subfolder of the data directory.
export const TASK_FILES_DIR = path.join(DATA_DIR, "task-files");

// Built frontend assets to serve in production. Override with PUBLIC_DIR.
export const PUBLIC_DIR =
  process.env.PUBLIC_DIR || path.resolve(__dirname, "../public");

// Default task list file when none is specified via the `?file=` query param.
export const DEFAULT_TASK_FILE = "reminders.json";

// Max upload size for task files (10 MB).
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
