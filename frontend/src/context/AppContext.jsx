import { createContext, useEffect, useState, useCallback } from "react";

export const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

export const AppProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar medicamentos - optimizado
  const loadMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/medications`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      setMedications(data);
      return data;
    } catch (error) {
      console.error("Error loading medications:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // Agregar nuevo producto
  const addMedication = async (medication) => {
    try {
      const res = await fetch(`${API_URL}/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medication),
      });
      
      if (res.ok) {
        const newMedication = await res.json();
        const addedMedication = Array.isArray(newMedication) ? newMedication[0] : newMedication;
        setMedications(prev => [...prev, addedMedication]);
        return { success: true, data: addedMedication };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.error || "Error al agregar producto" };
      }
    } catch (error) {
      console.error("Error adding medication:", error);
      return { success: false, error: "Error de conexión" };
    }
  };

  // Actualizar medicamento (para ventas y restock)
  const updateMedication = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/medications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      
      if (res.ok) {
        const updatedMedication = await res.json();
        const medication = Array.isArray(updatedMedication) ? updatedMedication[0] : updatedMedication;
        setMedications(prev => 
          prev.map(m => m.medicationID === id ? medication : m)
        );
        return { success: true, data: medication };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.error || "Error al actualizar producto" };
      }
    } catch (error) {
      console.error("Error updating medication:", error);
      return { success: false, error: "Error de conexión" };
    }
  };

  // Registrar venta - CORREGIDO con ExpirationDate
  const registerSale = async (saleData) => {
    try {
      console.log("Registrando venta con datos:", saleData);
      
      // Obtener el producto para tener su ExpirationDate
      const product = medications.find(m => m.medicationID === saleData.medicationID);
      
      if (!product) {
        console.error("Producto no encontrado:", saleData.medicationID);
        return { success: false, error: "Producto no encontrado" };
      }

      // Preparar datos para el movimiento según tu schema
      const movementData = {
        Type: "salida",
        Amount: saleData.Amount,
        MovementDate: new Date().toISOString(),
        medicationID: saleData.medicationID,
        ExpirationDate: product.ExpirationDate || null // Usar la fecha de expiración del producto
      };
      
      console.log("Datos de movimiento a enviar:", movementData);
      
      const res = await fetch(`${API_URL}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(movementData),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log("Venta registrada exitosamente:", result);
        return { success: true, data: result };
      } else {
        const errorData = await res.json();
        console.error("Error del backend al registrar venta:", errorData);
        return { success: false, error: errorData.error || "Error al registrar venta" };
      }
    } catch (error) {
      console.error("Error registering sale:", error);
      return { success: false, error: "Error de conexión" };
    }
  };

  // Registrar entrada de stock - también corregido
  const registerEntry = async (entryData) => {
    try {
      console.log("Registrando entrada con datos:", entryData);
      
      // Obtener el producto para tener su ExpirationDate
      const product = medications.find(m => m.medicationID === entryData.medicationID);
      
      if (!product) {
        console.error("Producto no encontrado:", entryData.medicationID);
        return { success: false, error: "Producto no encontrado" };
      }

      const movementData = {
        Type: "entrada",
        Amount: entryData.Amount,
        MovementDate: new Date().toISOString(),
        medicationID: entryData.medicationID,
        ExpirationDate: product.ExpirationDate || null // Usar la fecha de expiración del producto
      };
      
      console.log("Datos de entrada a enviar:", movementData);
      
      const res = await fetch(`${API_URL}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(movementData),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log("Entrada registrada exitosamente:", result);
        return { success: true, data: result };
      } else {
        const errorData = await res.json();
        console.error("Error del backend al registrar entrada:", errorData);
        return { success: false, error: errorData.error || "Error al registrar entrada" };
      }
    } catch (error) {
      console.error("Error registering entry:", error);
      return { success: false, error: "Error de conexión" };
    }
  };

  // Cargar medicamentos al inicio
  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const contextValue = {
    medications,
    setMedications,
    loadMedications,
    addMedication,
    updateMedication,
    registerSale,
    registerEntry,
    isLoading
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};