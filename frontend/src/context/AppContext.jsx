import { createContext, useEffect, useState, useCallback } from "react";

export const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

export const AppProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ========== FUNCIONES DE HORA PARA NICARAGUA (UTC-6) ==========
  
  // Obtener hora actual de Nicaragua en formato ISO
  const getNicaraguaISOString = () => {
    const now = new Date();
    // Nicaragua está en UTC-6 (-6 horas)
    const nicaraguaOffset = -6 * 60; // en minutos
    const localOffset = now.getTimezoneOffset(); // en minutos
    const offsetDiff = nicaraguaOffset - localOffset;
    
    // Ajustar la hora para Nicaragua
    const nicaraguaTime = new Date(now.getTime() + offsetDiff * 60000);
    return nicaraguaTime.toISOString();
  };

  // Obtener fecha y hora de Nicaragua formateada
  const getNicaraguaDateTime = () => {
    const now = new Date();
    const nicaraguaOffset = -6 * 60 * 60000; // UTC-6 en milisegundos
    const nicaraguaTime = new Date(now.getTime() + nicaraguaOffset);
    
    return {
      isoString: nicaraguaTime.toISOString(),
      date: nicaraguaTime.toLocaleDateString('es-NI'),
      time: nicaraguaTime.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      fullDateTime: nicaraguaTime.toLocaleString('es-NI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  // Convertir cualquier fecha a hora de Nicaragua
  const convertToNicaraguaTime = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const nicaraguaOffset = -6 * 60 * 60000; // UTC-6 en milisegundos
    
    // Si la fecha ya está en formato Nicaragua, no ajustar
    // Si no, ajustar a Nicaragua
    const nicaraguaTime = new Date(date.getTime() - nicaraguaOffset);
    return nicaraguaTime;
  };

  // ========== FUNCIONES PRINCIPALES ==========

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

  // Agregar nuevo producto - CON HORA DE NICARAGUA
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
        
        // Registrar movimiento de tipo "nuevo" con hora de Nicaragua
        const movementData = {
          Type: "nuevo",
          Amount: addedMedication.Amount || medication.Amount || 0,
          MovementDate: getNicaraguaISOString(), // ← HORA DE NICARAGUA
          medicationID: addedMedication.medicationID,
          ExpirationDate: addedMedication.ExpirationDate || medication.ExpirationDate || null
        };
        
        await fetch(`${API_URL}/movements`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(movementData),
        });
        
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

  // ELIMINAR medicamento - CON HORA DE NICARAGUA
  const deleteMedication = async (id) => {
    try {
      console.log("Eliminando medicamento ID:", id);
      
      // Obtener el producto
      const product = medications.find(m => m.medicationID === id);
      
      if (product) {
        // Registrar movimiento con hora de Nicaragua
        const movementData = {
          Type: "eliminado",
          Amount: product.Amount || 0,
          MovementDate: getNicaraguaISOString(), // ← HORA DE NICARAGUA
          medicationID: id,
          ExpirationDate: product.ExpirationDate || null,
          Reason: "Producto caducado eliminado del inventario"
        };
        
        console.log("Registrando movimiento de eliminación:", movementData);
        
        await fetch(`${API_URL}/movements`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(movementData),
        });
      }
      
      // Eliminar el medicamento
      const res = await fetch(`${API_URL}/medications/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (res.ok) {
        // Actualizar estado local
        setMedications(prev => prev.filter(m => m.medicationID !== id));
        
        console.log("Medicamento eliminado exitosamente");
        return { 
          success: true, 
          message: 'Medicamento eliminado exitosamente',
          data: { medicationID: id }
        };
      } else {
        const errorData = await res.json();
        console.error("Error del backend al eliminar:", errorData);
        return { 
          success: false, 
          error: errorData.error || "Error al eliminar producto" 
        };
      }
    } catch (error) {
      console.error("Error deleting medication:", error);
      return { 
        success: false, 
        error: error.message || "Error de conexión al eliminar producto" 
      };
    }
  };

  // Registrar venta - CON HORA DE NICARAGUA
  const registerSale = async (saleData) => {
    try {
      console.log("Registrando venta con datos:", saleData);
      
      // Obtener el producto
      const product = medications.find(m => m.medicationID === saleData.medicationID);
      
      if (!product) {
        console.error("Producto no encontrado:", saleData.medicationID);
        return { success: false, error: "Producto no encontrado" };
      }

      // Preparar datos con hora de Nicaragua
      const movementData = {
        Type: "salida",
        Amount: saleData.Amount,
        MovementDate: getNicaraguaISOString(), // ← HORA DE NICARAGUA
        medicationID: saleData.medicationID,
        ExpirationDate: product.ExpirationDate || null
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

  // Registrar entrada de stock - CON HORA DE NICARAGUA
  const registerEntry = async (entryData) => {
    try {
      console.log("Registrando entrada con datos:", entryData);
      
      // Obtener el producto
      const product = medications.find(m => m.medicationID === entryData.medicationID);
      
      if (!product) {
        console.error("Producto no encontrado:", entryData.medicationID);
        return { success: false, error: "Producto no encontrado" };
      }

      const movementData = {
        Type: "entrada",
        Amount: entryData.Amount,
        MovementDate: getNicaraguaISOString(), // ← HORA DE NICARAGUA
        medicationID: entryData.medicationID,
        ExpirationDate: product.ExpirationDate || null
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

  // ========== FUNCIONES UTILITARIAS EXPORTADAS ==========
  
  // Para usar en componentes que necesiten formatear fechas
  const formatNicaraguaDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    
    const nicaraguaTime = convertToNicaraguaTime(dateString);
    return nicaraguaTime.toLocaleDateString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatNicaraguaTime = (dateString) => {
    if (!dateString) return "Hora no disponible";
    
    const nicaraguaTime = convertToNicaraguaTime(dateString);
    return nicaraguaTime.toLocaleTimeString('es-NI', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatNicaraguaDateTime = (dateString) => {
    if (!dateString) return "Fecha/hora no disponible";
    
    const nicaraguaTime = convertToNicaraguaTime(dateString);
    return nicaraguaTime.toLocaleString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // ========== EFECTO INICIAL ==========

  // Cargar medicamentos al inicio
  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  // ========== VALOR DEL CONTEXTO ==========

  const contextValue = {
    // Estados
    medications,
    setMedications,
    isLoading,
    
    // Funciones principales
    loadMedications,
    addMedication,
    updateMedication,
    deleteMedication,
    registerSale,
    registerEntry,
    
    // Funciones de hora para Nicaragua
    getNicaraguaISOString,
    getNicaraguaDateTime,
    convertToNicaraguaTime,
    formatNicaraguaDate,
    formatNicaraguaTime,
    formatNicaraguaDateTime
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};