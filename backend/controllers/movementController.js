import * as movementService from "../services/movementService.js";

export const getMovements = async (req, res) => {
  try {
    const data = await movementService.getAllMovements();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMovement = async (req, res) => {
  try {
    const data = await movementService.createMovement(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
