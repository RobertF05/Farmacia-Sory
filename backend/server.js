import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import medicationRoutes from "./routes/medicationRoute.js";
import movementRoutes from "./routes/movementRoute.js";
import userRoutes from "./routes/userRoute.js";

dotenv.config();

const app = express();

// FALTA 1: RUTA RAÍZ (Render necesita esto)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend de Farmacia Familiar funcionando ✅",
    timestamp: new Date().toISOString(),
    endpoints: {
      login: "/api/users/login",
      medications: "/api/medications",
      movements: "/api/movements"
    }
  });
});

// FALTA 2: HEALTH CHECK (Para monitoreo)
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// CORREGIR CORS: Permitir tanto producción como desarrollo
app.use(cors({
  origin: [
    "http://localhost:5173",  // Desarrollo local Vite
    "http://localhost:3000",  // Desarrollo alternativo
    "https://farmacia-sory.vercel.app"  // Producción Vercel
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Rutas
app.use("/api/medications", medicationRoutes);
app.use("/api/movements", movementRoutes);
app.use("/api/users", userRoutes);

// FALTA 3: RUTA DE FALLBACK PARA /medications (si tu frontend no puede cambiar)
app.use("/medications", (req, res, next) => {
  // Redirigir al endpoint correcto
  res.redirect(308, `/api${req.originalUrl}`);
});

// Error handling para rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
    available_endpoints: ["/api/medications", "/api/users/login", "/api/movements"]
  });
});

// IMPORTANTE: Escuchar en 0.0.0.0 para Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor backend funcionando en puerto ${PORT}`);
  console.log(`🌐 Accesible en: https://farmacia-sory.onrender.com`);
});