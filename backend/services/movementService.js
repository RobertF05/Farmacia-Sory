import { supabase } from "../config/db.js";

export const getAllMovements = async () => {
  const { data, error } = await supabase
    .from("movements")
    .select("*, medications(Name)");

  if (error) throw error;
  return data;
};

export const createMovement = async (movement) => {
  const { data, error } = await supabase
    .from("movements")
    .insert([movement])
    .select();

  if (error) throw error;
  return data;
};
