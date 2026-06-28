import { Router } from "express";
import {
  listInterns,
  getIntern,
  createIntern,
  updateIntern,
  deleteIntern,
} from "../controllers/interns.controller.js";

const router = Router();

router.get("/", listInterns);
router.post("/", createIntern);
router.get("/:id", getIntern);
router.put("/:id", updateIntern);
router.delete("/:id", deleteIntern);

export default router;
