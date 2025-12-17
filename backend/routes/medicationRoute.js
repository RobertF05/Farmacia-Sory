import express from "express";
import {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
} from "../controllers/medicationController.js";

const router = express.Router();

router.get("/", getMedications);
router.get("/:id", getMedication);
router.post("/", createMedication);
router.put("/:id", updateMedication);
router.delete("/:id", deleteMedication);

export default router;
