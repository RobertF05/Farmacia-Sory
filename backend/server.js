import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import medicationRoutes from "./routes/medicationRoute.js";
import movementRoutes from "./routes/movementRoute.js";
import userRoutes from "./routes/userRoute.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/medications", medicationRoutes);
app.use("/api/movements", movementRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
