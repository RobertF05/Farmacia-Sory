import * as medicationService from "../services/medicationService.js";

export const getMedications = async (req, res) => {
  try {
    const data = await medicationService.getAllMedications();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMedication = async (req, res) => {
  try {
    const data = await medicationService.getMedicationById(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: "Medicamento no encontrado" });
  }
};

export const createMedication = async (req, res) => {
  try {
    const data = await medicationService.createMedication(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateMedication = async (req, res) => {
  try {
    const data = await medicationService.updateMedication(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteMedication = async (req, res) => {
  try {
    await medicationService.deleteMedication(req.params.id);
    res.json({ message: "Medicamento eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
