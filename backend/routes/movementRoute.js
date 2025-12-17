import express from "express";
import {
  getMovements,
  createMovement,
} from "../controllers/movementController.js";

const router = express.Router();

router.get("/", getMovements);
router.post("/", createMovement);

export default router;
