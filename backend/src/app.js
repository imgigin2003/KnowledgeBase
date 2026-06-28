import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { PUBLIC_DIR } from "./config.js";

const app = express();

app.use(cors());
app.use(express.json());

// All application routes live under /api.
app.use("/api", apiRoutes);

// In production, serve the built frontend and fall back to index.html (SPA).
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.use((req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });
}

export default app;
