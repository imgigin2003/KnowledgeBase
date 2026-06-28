import { Router } from "express";
import articlesRoutes from "./articles.routes.js";
import internsRoutes from "./interns.routes.js";
import categoriesRoutes from "./categories.routes.js";
import tasksRoutes from "./tasks.routes.js";
import taskFilesRoutes from "./taskFiles.routes.js";

const router = Router();

router.use("/articles", articlesRoutes);
router.use("/interns", internsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/tasks", tasksRoutes);
router.use("/task-files", taskFilesRoutes);

export default router;
