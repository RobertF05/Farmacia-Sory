// userController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userService from "../services/userService.js";

export const registerUser = async (req, res) => {
  try {
    const data = await userService.createUser(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Usuario y contraseña son requeridos' 
      });
    }
    
    // Buscar usuario
    const user = await userService.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      });
    }
    
    // Verificar contraseña (ajusta según tu método de hash)
    // Si las contraseñas no están encriptadas, compara directamente
    const isValidPassword = user.password === password;
    // O si usas bcrypt:
    // const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role || 'user',
        pharmacyId: user.pharmacy_id || null
      },
      process.env.JWT_SECRET || 'farmacia_sory_secret_key',
      { expiresIn: '24h' }
    );
    
    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Login exitoso'
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
};

// También puedes añadir esta función para verificar token
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token no proporcionado' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'farmacia_sory_secret_key');
    
    res.json({
      success: true,
      user: decoded,
      valid: true
    });
    
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Token inválido o expirado' 
    });
  }
};