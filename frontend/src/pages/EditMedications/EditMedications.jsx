import { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import "./EditMedications.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faSave, 
  faTimes, 
  faCheck, 
  faBox, 
  faDollarSign,
  faCalendarAlt,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

export default function EditMedications() {
  const { medications, updateMedication } = useContext(AppContext);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState(""); // Estado para el buscador

  // Inicializar datos editados cuando cambian los medicamentos
  useEffect(() => {
    if (medications) {
      const initialData = {};
      medications.forEach(med => {
        initialData[med.medicationID] = {
          Name: med.Name || "",
          Price: med.Price || 0,
          ExpirationDate: med.ExpirationDate ? formatDateForInput(med.ExpirationDate) : ""
        };
      });
      setEditedData(initialData);
    }
  }, [medications]);

  // Filtrar productos basado en la búsqueda
  const filteredMedications = medications 
    ? medications.filter(med =>
        med.Name?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Función para formatear precio
  const formatPrice = (price) => {
    return `C$${parseFloat(price || 0).toFixed(2)}`;
  };

  // Función para formatear fecha para input type="date"
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "";
    }
  };

  // Función para formatear fecha para mostrar
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "No especificada";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString('es-NI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Fecha inválida";
    }
  };

  // Iniciar edición
  const handleEdit = (medication) => {
    setEditingId(medication.medicationID);
    setEditedData(prev => ({
      ...prev,
      [medication.medicationID]: {
        Name: medication.Name || "",
        Price: medication.Price || 0,
        ExpirationDate: medication.ExpirationDate ? formatDateForInput(medication.ExpirationDate) : ""
      }
    }));
  };

  // Cancelar edición
  const handleCancel = (medicationID) => {
    setEditingId(null);
    setEditedData(prev => ({
      ...prev,
      [medicationID]: {
        Name: medications.find(m => m.medicationID === medicationID)?.Name || "",
        Price: medications.find(m => m.medicationID === medicationID)?.Price || 0,
        ExpirationDate: medications.find(m => m.medicationID === medicationID)?.ExpirationDate 
          ? formatDateForInput(medications.find(m => m.medicationID === medicationID)?.ExpirationDate)
          : ""
      }
    }));
  };

  // Guardar cambios
  const handleSave = async (medication) => {
    const medicationID = medication.medicationID;
    const currentData = editedData[medicationID];
    
    // Validar datos
    if (!currentData.Name || currentData.Name.trim() === "") {
      showNotification("El nombre del producto es requerido", "error");
      return;
    }

    if (currentData.Price < 0) {
      showNotification("El precio no puede ser negativo", "error");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [medicationID]: true }));

    try {
      // Preparar datos para actualizar
      const updateData = {
        Name: currentData.Name.trim(),
        Price: parseFloat(currentData.Price) || 0
      };

      // Agregar fecha de expiración solo si se proporcionó
      if (currentData.ExpirationDate) {
        updateData.ExpirationDate = currentData.ExpirationDate;
      }

      const result = await updateMedication(medicationID, updateData);
      
      if (result.success) {
        showNotification("Producto actualizado correctamente", "success");
        setEditingId(null);
      } else {
        showNotification(result.error || "Error al actualizar producto", "error");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      showNotification("Error de conexión", "error");
    } finally {
      setLoadingStates(prev => ({ ...prev, [medicationID]: false }));
    }
  };

  // Manejar cambios en los campos de edición
  const handleInputChange = (medicationID, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [medicationID]: {
        ...prev[medicationID],
        [field]: value
      }
    }));
  };

  // Mostrar notificación
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Manejar el caso cuando medications es undefined
  if (!medications) {
    return (
      <div className="edit-medications-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-medications-container">
      {/* Encabezado */}
      <div className="edit-header">
        <div className="header-left">
          <h2>
            <FontAwesomeIcon icon={faBox} className="header-icon" />
            Editar Productos
          </h2>
          <p className="subtitle">Modifica la información de los productos del inventario</p>
        </div>
        <div className="header-right">
          <div className="edit-count">
            <span className="count-number">{medications.length}</span>
            <span className="count-label">productos</span>
          </div>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <FontAwesomeIcon icon={notification.type === "success" ? faCheck : faTimes} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Instrucciones */}
      <div className="instructions">
        <p>Haz clic en el botón <strong>Editar</strong> para modificar un producto. Los cambios se guardarán automáticamente al hacer clic en <strong>Guardar</strong>.</p>
      </div>

      {/* Barra de búsqueda - NUEVO */}
      <div className="edit-search-section">
        <div className="search-wrapper">
          <input
            className="search-box"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          {search && (
            <button 
              className="btn-clear-filters" 
              onClick={() => setSearch("")}
              title="Limpiar búsqueda"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        
        <div className="search-info">
          <span>
            Mostrando {filteredMedications.length} de {medications.length} productos
          </span>
        </div>
      </div>

      {/* Sección de tabla */}
      <div className="edit-section">
        {medications.length === 0 ? (
          <div className="no-products-message">
            <div className="no-products-icon">
              <FontAwesomeIcon icon={faBox} />
            </div>
            <h3>No hay productos disponibles</h3>
            <p>Agrega productos al inventario para poder editarlos aquí.</p>
          </div>
        ) : filteredMedications.length === 0 && search ? (
          <div className="no-products-message">
            <div className="no-products-icon">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <h3>No se encontraron productos</h3>
            <p>No hay productos que coincidan con "{search}"</p>
            <button 
              className="btn-clear-search"
              onClick={() => setSearch("")}
            >
              Mostrar todos los productos
            </button>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="edit-table">
              <thead>
                <tr>
                  <th>Nombre del Producto</th>
                  <th>Cantidad en Stock</th>
                  <th>Precio Unitario</th>
                  <th>Fecha de Expiración</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedications.map(medication => {
                  const isEditing = editingId === medication.medicationID;
                  const isLoading = loadingStates[medication.medicationID];
                  
                  return (
                    <tr key={medication.medicationID} className={isEditing ? "editing-row" : ""}>
                      {/* Nombre */}
                      <td>
                        {isEditing ? (
                          <div className="edit-field">
                            <div className="field-label">
                              <FontAwesomeIcon icon={faBox} />
                              <span>Nombre</span>
                            </div>
                            <input
                              type="text"
                              value={editedData[medication.medicationID]?.Name || ""}
                              onChange={(e) => handleInputChange(medication.medicationID, "Name", e.target.value)}
                              className="edit-input"
                              placeholder="Nombre del producto"
                              disabled={isLoading}
                            />
                          </div>
                        ) : (
                          <div className="product-name-display">
                            <span className="product-name">{medication.Name || "Sin nombre"}</span>
                          </div>
                        )}
                      </td>
                      
                      {/* Cantidad (solo lectura) */}
                      <td>
                        <div className="amount-display">
                          <span className={`amount-badge ${medication.Amount < 10 ? "low-stock" : ""}`}>
                            {medication.Amount || 0} unidades
                          </span>
                          {medication.Amount < 10 && (
                            <span className="low-stock-warning">Stock bajo</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Precio */}
                      <td>
                        {isEditing ? (
                          <div className="edit-field">
                            <div className="field-label">
                              <FontAwesomeIcon icon={faDollarSign} />
                              <span>Precio</span>
                            </div>
                            <div className="price-input-container">
                              <span className="currency-prefix">C$</span>
                              <input
                                type="number"
                                value={editedData[medication.medicationID]?.Price || 0}
                                onChange={(e) => handleInputChange(medication.medicationID, "Price", e.target.value)}
                                className="edit-input price-input"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="price-display">
                            <span className="price-value">{formatPrice(medication.Price)}</span>
                          </div>
                        )}
                      </td>
                      
                      {/* Fecha de Expiración */}
                      <td>
                        {isEditing ? (
                          <div className="edit-field">
                            <div className="field-label">
                              <FontAwesomeIcon icon={faCalendarAlt} />
                              <span>Expiración</span>
                            </div>
                            <input
                              type="date"
                              value={editedData[medication.medicationID]?.ExpirationDate || ""}
                              onChange={(e) => handleInputChange(medication.medicationID, "ExpirationDate", e.target.value)}
                              className="edit-input date-input"
                              disabled={isLoading}
                            />
                          </div>
                        ) : (
                          <div className="expiration-display">
                            <span className={`expiration-date ${!medication.ExpirationDate ? "no-date" : ""}`}>
                              {formatDateForDisplay(medication.ExpirationDate)}
                            </span>
                          </div>
                        )}
                      </td>
                      
                      {/* Acciones */}
                      <td>
                        {isEditing ? (
                          <div className="action-buttons">
                            <button
                              className="save-btn"
                              onClick={() => handleSave(medication)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <div className="mini-spinner"></div>
                                  <span>Guardando...</span>
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faSave} />
                                  <span>Guardar</span>
                                </>
                              )}
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => handleCancel(medication.medicationID)}
                              disabled={isLoading}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(medication)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            <span>Editar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}