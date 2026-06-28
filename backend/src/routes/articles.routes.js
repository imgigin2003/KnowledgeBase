import { Router } from "express";
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/articles.controller.js";

const router = Router();

router.get("/", listArticles);
router.post("/", createArticle);
router.get("/:id", getArticle);
router.put("/:id", updateArticle);
router.delete("/:id", deleteArticle);

router.post("/:id/comments", addComment);
router.put("/:aid/comments/:cid", updateComment);
router.delete("/:aid/comments/:cid", deleteComment);

export default router;
