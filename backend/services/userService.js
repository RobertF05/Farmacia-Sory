import { supabase } from "../config/db.js";

export const createUser = async (user) => {
  const { data, error } = await supabase
    .from("users")
    .insert([user])
    .select();

  if (error) throw error;
  return data;
};

export const getUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) throw error;
  return data;
};
