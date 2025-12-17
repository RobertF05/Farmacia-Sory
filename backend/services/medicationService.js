import { supabase } from "../config/db.js";

export const getAllMedications = async () => {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .order("Name");

  if (error) throw error;
  return data;
};

export const getMedicationById = async (id) => {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("medicationID", id)
    .single();

  if (error) throw error;
  return data;
};

export const createMedication = async (medication) => {
  const { data, error } = await supabase
    .from("medications")
    .insert([medication])
    .select();

  if (error) throw error;
  return data;
};

export const updateMedication = async (id, medication) => {
  const { data, error } = await supabase
    .from("medications")
    .update(medication)
    .eq("medicationID", id)
    .select();

  if (error) throw error;
  return data;
};

export const deleteMedication = async (id) => {
  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("medicationID", id);

  if (error) throw error;
};
