import { Router } from "express";
import { upload } from "../middleware/upload.js";
import {
  listTaskFiles,
  uploadTaskFile,
} from "../controllers/taskFiles.controller.js";

const router = Router();

router.get("/", listTaskFiles);
router.post("/upload", upload.single("file"), uploadTaskFile);

export default router;
