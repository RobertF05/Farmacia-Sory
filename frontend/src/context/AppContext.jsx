import { createContext, useEffect, useState, useCallback, useContext } from "react";
import { AuthContext } from "./AuthContext"; // Importar el contexto de auth

export const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

export const AppProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Obtener token del AuthContext
  const { token } = useContext(AuthContext);

  // ========== FUNCIONES DE HORA PARA NICARAGUA ==========
  
  const getNicaraguaISOString = () => {
    const now = new Date();
    const nicaraguaOffset = -6 * 60;
    const localOffset = now.getTimezoneOffset();
    const offsetDiff = nicaraguaOffset - localOffset;
    const nicaraguaTime = new Date(now.getTime() + offsetDiff * 60000);
    return nicaraguaTime.toISOString();
  };

  const getNicaraguaDateTime = () => {
    const now = new Date();
    const nicaraguaOffset = -6 * 60 * 60000;
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
    const nicaraguaOffset = -6 * 60 * 60000;
    
    // Ajustar a Nicaragua
    const nicaraguaTime = new Date(date.getTime() - nicaraguaOffset);
    return nicaraguaTime;
  };

  // ========== FUNCIONES PRINCIPALES (ACTUALIZADAS CON AUTH) ==========

  // Función auxiliar para hacer fetch con autenticación
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Agregar token de autenticación si existe
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }, [token]);

  // Cargar medicamentos - CON AUTENTICACIÓN
  const loadMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Cargando medicamentos desde:", `${API_URL}/medications`);
      console.log("🔑 Token disponible:", token ? "Sí" : "No");
      
      const res = await authFetch(`${API_URL}/medications`);
      
      if (!res.ok) {
        if (res.status === 401) {
          // Token expirado o inválido
          console.error("❌ Token expirado o inválido");
          throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente.");
        }
        
        // Si el endpoint no existe, usar datos de prueba
        if (res.status === 404) {
          console.warn("⚠️ Endpoint no encontrado. Usando datos de prueba.");
          
          // Datos de prueba para desarrollo
          const mockMedications = [
            {
              medicationID: 1,
              name: "Paracetamol 500mg",
              description: "Analgésico y antipirético",
              category: "Analgésico",
              price: 0.50,
              amount: 100,
              expirationDate: "2025-12-31",
              supplier: "Laboratorios Farmacéuticos S.A.",
              minStock: 10,
              maxStock: 200,
              location: "Estante A1",
              barcode: "123456789012",
              requiresPrescription: false,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              medicationID: 2,
              name: "Amoxicilina 250mg",
              description: "Antibiótico de amplio espectro",
              category: "Antibiótico",
              price: 1.20,
              amount: 50,
              expirationDate: "2024-06-30",
              supplier: "Farmacéutica Internacional",
              minStock: 5,
              maxStock: 100,
              location: "Estante B2",
              barcode: "987654321098",
              requiresPrescription: true,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              medicationID: 3,
              name: "Ibuprofeno 400mg",
              description: "Antiinflamatorio no esteroideo",
              category: "Antiinflamatorio",
              price: 0.75,
              amount: 75,
              expirationDate: "2025-09-15",
              supplier: "Droguería Central",
              minStock: 15,
              maxStock: 150,
              location: "Estante A3",
              barcode: "456123789045",
              requiresPrescription: false,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          setMedications(mockMedications);
          return mockMedications;
        }
        
        const errorText = await res.text();
        console.error(`❌ Error HTTP ${res.status}:`, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("✅ Medicamentos cargados:", data.length, "registros");
      setMedications(data);
      return data;
    } catch (error) {
      console.error("❌ Error loading medications:", error);
      
      // Si es un error de conexión, usar datos de prueba
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        console.warn("🌐 Sin conexión al backend. Usando datos de prueba locales.");
        
        // Datos de prueba locales
        const localData = JSON.parse(localStorage.getItem('farmacia_medications')) || [
          {
            medicationID: Date.now(),
            name: "Paracetamol 500mg",
            price: 0.50,
            amount: 100,
            expirationDate: "2025-12-31",
            category: "Analgésico",
            isActive: true
          }
        ];
        
        setMedications(localData);
        return localData;
      }
      
      if (error.message.includes("Sesión expirada")) {
        // Redirigir al login
        window.location.href = "/login";
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, token, authFetch]);

  // Agregar nuevo producto - CON AUTENTICACIÓN
  const addMedication = async (medication) => {
    try {
      console.log("➕ Agregando medicamento:", medication);
      
      const res = await authFetch(`${API_URL}/medications`, {
        method: "POST",
        body: JSON.stringify(medication),
      });
      
      if (res.ok) {
        const newMedication = await res.json();
        const addedMedication = Array.isArray(newMedication) ? newMedication[0] : newMedication;
        
        // Actualizar estado local
        setMedications(prev => [...prev, addedMedication]);
        
        // Guardar en localStorage para persistencia
        const currentMedications = JSON.parse(localStorage.getItem('farmacia_medications')) || [];
        currentMedications.push(addedMedication);
        localStorage.setItem('farmacia_medications', JSON.stringify(currentMedications));
        
        // Registrar movimiento
        const movementData = {
          Type: "nuevo",
          Amount: addedMedication.Amount || medication.Amount || 0,
          MovementDate: getNicaraguaISOString(),
          medicationID: addedMedication.medicationID,
          ExpirationDate: addedMedication.ExpirationDate || medication.ExpirationDate || null
        };
        
        await authFetch(`${API_URL}/movements`, {
          method: "POST",
          body: JSON.stringify(movementData),
        });
        
        console.log("✅ Medicamento agregado exitosamente");
        return { success: true, data: addedMedication };
      } else {
        // Si falla, guardar localmente
        console.warn("⚠️ Backend no disponible. Guardando localmente.");
        
        const localMedication = {
          ...medication,
          medicationID: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Actualizar estado local
        setMedications(prev => [...prev, localMedication]);
        
        // Guardar en localStorage
        const currentMedications = JSON.parse(localStorage.getItem('farmacia_medications')) || [];
        currentMedications.push(localMedication);
        localStorage.setItem('farmacia_medications', JSON.stringify(currentMedications));
        
        return { 
          success: true, 
          data: localMedication,
          message: "Guardado localmente (modo offline)"
        };
      }
    } catch (error) {
      console.error("❌ Error adding medication:", error);
      
      // Guardar localmente en caso de error
      const localMedication = {
        ...medication,
        medicationID: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setMedications(prev => [...prev, localMedication]);
      
      const currentMedications = JSON.parse(localStorage.getItem('farmacia_medications')) || [];
      currentMedications.push(localMedication);
      localStorage.setItem('farmacia_medications', JSON.stringify(currentMedications));
      
      return { 
        success: true, 
        data: localMedication,
        message: "Guardado localmente (error de conexión)"
      };
    }
  };

  // Actualizar medicamento - CON AUTENTICACIÓN
  const updateMedication = async (id, updatedData) => {
    try {
      console.log("✏️ Actualizando medicamento ID:", id, "con:", updatedData);
      
      const res = await authFetch(`${API_URL}/medications/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedData),
      });
      
      if (res.ok) {
        const updatedMedication = await res.json();
        const medication = Array.isArray(updatedMedication) ? updatedMedication[0] : updatedMedication;
        
        // Actualizar estado local
        setMedications(prev => 
          prev.map(m => m.medicationID === id ? medication : m)
        );
        
        // Actualizar localStorage
        const currentMedications = JSON.parse(localStorage.getItem('farmacia_medications')) || [];
        const updatedMedications = currentMedications.map(m => 
          m.medicationID === id ? medication : m
        );
        localStorage.setItem('farmacia_medications', JSON.stringify(updatedMedications));
        
        return { success: true, data: medication };
      } else {
        // Actualizar localmente
        console.warn("⚠️ Backend no disponible. Actualizando localmente.");
        
        setMedications(prev => 
          prev.map(m => {
            if (m.medicationID === id) {
              return {
                ...m,
                ...updatedData,
                updatedAt: new Date().toISOString()
              };
            }
            return m;
          })
        );
        
        // Actualizar localStorage
        const currentMedications = JSON.parse(localStorage.getItem('farmacia_medications')) || [];
        const updatedMedications = currentMedications.map(m => {
          if (m.medicationID === id) {
            return {
              ...m,
              ...updatedData,
              updatedAt: new Date().toISOString()
            };
          }
          return m;
        });
        localStorage.setItem('farmacia_medications', JSON.stringify(updatedMedications));
        
        return { 
          success: true, 
          message: "Actualizado localmente (modo offline)"
        };
      }
    } catch (error) {
      console.error("❌ Error updating medication:", error);
      
      // Actualizar localmente
      setMedications(prev => 
        prev.map(m => {
          if (m.medicationID === id) {
            return {
              ...m,
              ...updatedData,
              updatedAt: new Date().toISOString()
            };
          }
          return m;
        })
      );
      
      return { 
        success: true, 
        message: "Actualizado localmente (error de conexión)"
      };
    }
  };

  // Eliminar medicamento - CON AUTENTICACIÓN
  const deleteMedication = async (id) => {
    try {
      console.log("🗑️ Eliminando medicamento ID:", id);
      
      // Obtener el producto
      const product = medications.find(m => m.medicationID === id);
      
      if (product) {
        // Registrar movimiento
        const movementData = {
          Type: "eliminado",
          Amount: product.Amount || 0,
          MovementDate: getNicaraguaISOString(),
          medicationID: id,
          ExpirationDate: product.ExpirationDate || null,
          Reason: "Producto eliminado del inventario"
        };
        
        await authFetch(`${API_URL}/movements`, {
          method: "POST",
          body: JSON.stringify(movementData),
        });
      }
      
      // Eliminar el medicamento
      const res = await authFetch(`${API_URL}/medications/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Actualizar estado local
        setMedications(prev => prev.filter(m => m.medicationID !== id));
        
        // Actualizar localStorage
        const currentMedications = JSON.parse(localStorage.getItem('farmacia_medications')) || [];
        const filteredMedications = currentMedications.filter(m => m.medicationID !== id);
        localStorage.setItem('farmacia_medications', JSON.stringify(filteredMedications));
        
        console.log("✅ Medicamento eliminado exitosamente");
        return { 
          success: true, 
          message: 'Medicamento eliminado exitosamente',
          data: { medicationID: id }
        };
      } else {
        // Eliminar localmente
        console.warn("⚠️ Backend no disponible. Eliminando localmente.");
        
        setMedications(prev => prev.filter(m => m.medicationID !== id));
        
        const currentMedications = JSON.parse(localStorage.getItem('farmacia_medications')) || [];
        const filteredMedications = currentMedications.filter(m => m.medicationID !== id);
        localStorage.setItem('farmacia_medications', JSON.stringify(filteredMedications));
        
        return { 
          success: true, 
          message: 'Medicamento eliminado localmente (modo offline)',
          data: { medicationID: id }
        };
      }
    } catch (error) {
      console.error("❌ Error deleting medication:", error);
      
      // Eliminar localmente
      setMedications(prev => prev.filter(m => m.medicationID !== id));
      
      return { 
        success: true, 
        message: 'Medicamento eliminado localmente (error de conexión)',
        data: { medicationID: id }
      };
    }
  };

  // Registrar venta - CON AUTENTICACIÓN
  const registerSale = async (saleData) => {
    try {
      console.log("💰 Registrando venta:", saleData);
      
      const product = medications.find(m => m.medicationID === saleData.medicationID);
      
      if (!product) {
        return { success: false, error: "Producto no encontrado" };
      }

      const movementData = {
        Type: "salida",
        Amount: saleData.Amount,
        MovementDate: getNicaraguaISOString(),
        medicationID: saleData.medicationID,
        ExpirationDate: product.ExpirationDate || null
      };
      
      const res = await authFetch(`${API_URL}/movements`, {
        method: "POST",
        body: JSON.stringify(movementData),
      });
      
      if (res.ok) {
        const result = await res.json();
        
        // Actualizar cantidad en medicamento
        const newAmount = product.amount - saleData.Amount;
        await updateMedication(saleData.medicationID, { amount: newAmount });
        
        console.log("✅ Venta registrada exitosamente");
        return { success: true, data: result };
      } else {
        // Registrar localmente
        console.warn("⚠️ Backend no disponible. Registrando venta localmente.");
        
        // Actualizar cantidad localmente
        const newAmount = product.amount - saleData.Amount;
        setMedications(prev => 
          prev.map(m => 
            m.medicationID === saleData.medicationID 
              ? { ...m, amount: newAmount } 
              : m
          )
        );
        
        // Guardar movimiento localmente
        const localMovements = JSON.parse(localStorage.getItem('farmacia_movements')) || [];
        localMovements.push({
          ...movementData,
          id: Date.now()
        });
        localStorage.setItem('farmacia_movements', JSON.stringify(localMovements));
        
        return { 
          success: true, 
          message: "Venta registrada localmente (modo offline)"
        };
      }
    } catch (error) {
      console.error("❌ Error registering sale:", error);
      
      // Registrar localmente
      const product = medications.find(m => m.medicationID === saleData.medicationID);
      if (product) {
        const newAmount = product.amount - saleData.Amount;
        setMedications(prev => 
          prev.map(m => 
            m.medicationID === saleData.medicationID 
              ? { ...m, amount: newAmount } 
              : m
          )
        );
      }
      
      return { 
        success: true, 
        message: "Venta registrada localmente (error de conexión)"
      };
    }
  };

  // Registrar entrada - CON AUTENTICACIÓN
  const registerEntry = async (entryData) => {
    try {
      console.log("📥 Registrando entrada:", entryData);
      
      const product = medications.find(m => m.medicationID === entryData.medicationID);
      
      if (!product) {
        return { success: false, error: "Producto no encontrado" };
      }

      const movementData = {
        Type: "entrada",
        Amount: entryData.Amount,
        MovementDate: getNicaraguaISOString(),
        medicationID: entryData.medicationID,
        ExpirationDate: product.ExpirationDate || null
      };
      
      const res = await authFetch(`${API_URL}/movements`, {
        method: "POST",
        body: JSON.stringify(movementData),
      });
      
      if (res.ok) {
        const result = await res.json();
        
        // Actualizar cantidad en medicamento
        const newAmount = product.amount + entryData.Amount;
        await updateMedication(entryData.medicationID, { amount: newAmount });
        
        console.log("✅ Entrada registrada exitosamente");
        return { success: true, data: result };
      } else {
        // Registrar localmente
        console.warn("⚠️ Backend no disponible. Registrando entrada localmente.");
        
        // Actualizar cantidad localmente
        const newAmount = product.amount + entryData.Amount;
        setMedications(prev => 
          prev.map(m => 
            m.medicationID === entryData.medicationID 
              ? { ...m, amount: newAmount } 
              : m
          )
        );
        
        // Guardar movimiento localmente
        const localMovements = JSON.parse(localStorage.getItem('farmacia_movements')) || [];
        localMovements.push({
          ...movementData,
          id: Date.now()
        });
        localStorage.setItem('farmacia_movements', JSON.stringify(localMovements));
        
        return { 
          success: true, 
          message: "Entrada registrada localmente (modo offline)"
        };
      }
    } catch (error) {
      console.error("❌ Error registering entry:", error);
      
      // Registrar localmente
      const product = medications.find(m => m.medicationID === entryData.medicationID);
      if (product) {
        const newAmount = product.amount + entryData.Amount;
        setMedications(prev => 
          prev.map(m => 
            m.medicationID === entryData.medicationID 
              ? { ...m, amount: newAmount } 
              : m
          )
        );
      }
      
      return { 
        success: true, 
        message: "Entrada registrada localmente (error de conexión)"
      };
    }
  };

  // ========== FUNCIONES UTILITARIAS EXPORTADAS ==========
  
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
  
  useEffect(() => {
    console.log("🔄 AppProvider iniciando...");
    console.log("🔑 Token disponible:", token ? "Sí" : "No");
    console.log("🌐 API URL:", API_URL);
    
    if (token) {
      loadMedications();
    } else {
      console.log("⏳ Esperando autenticación...");
      
      // Cargar datos locales si no hay token
      const localMedications = JSON.parse(localStorage.getItem('farmacia_medications'));
      if (localMedications && localMedications.length > 0) {
        console.log("📁 Cargando datos locales:", localMedications.length, "registros");
        setMedications(localMedications);
      }
      
      setIsLoading(false);
    }
  }, [loadMedications, token]);

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