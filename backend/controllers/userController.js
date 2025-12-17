import * as userService from "../services/userService.js";

export const registerUser = async (req, res) => {
  try {
    const data = await userService.createUser(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
