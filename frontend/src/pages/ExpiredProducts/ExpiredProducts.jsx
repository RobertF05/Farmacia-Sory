import { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import "./ExpiredProducts.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faTrash, 
  faSearch,
  faTimes,
  faBox,
  faCalendarTimes,
  faCheck,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

export default function ExpiredProducts() {
  const { medications, deleteMedication, loadMedications } = useContext(AppContext);
  const [search, setSearch] = useState("");
  const [filteredExpired, setFilteredExpired] = useState([]);
  const [isDeleting, setIsDeleting] = useState({});
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filtrar productos caducados basado en la fecha actual
  useEffect(() => {
    if (medications) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiredProducts = medications.filter(med => {
        if (!med.ExpirationDate) return false;
        
        try {
          const expirationDate = new Date(med.ExpirationDate);
          expirationDate.setHours(0, 0, 0, 0);
          return expirationDate < today;
        } catch (error) {
          console.error("Error procesando fecha:", med.ExpirationDate);
          return false;
        }
      });
      
      setFilteredExpired(expiredProducts);
    }
  }, [medications]);

  // Filtrar por búsqueda
  useEffect(() => {
    if (medications && search) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filtered = medications.filter(med => {
        // Primero verificar si está caducado
        if (!med.ExpirationDate) return false;
        
        try {
          const expirationDate = new Date(med.ExpirationDate);
          expirationDate.setHours(0, 0, 0, 0);
          const isExpired = expirationDate < today;
          
          // Si no está caducado, no mostrar
          if (!isExpired) return false;
          
          // Filtrar por nombre si hay búsqueda
          return med.Name?.toLowerCase().includes(search.toLowerCase());
        } catch (error) {
          return false;
        }
      });
      
      setFilteredExpired(filtered);
    } else if (medications) {
      // Si no hay búsqueda, mostrar todos los caducados
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiredProducts = medications.filter(med => {
        if (!med.ExpirationDate) return false;
        
        try {
          const expirationDate = new Date(med.ExpirationDate);
          expirationDate.setHours(0, 0, 0, 0);
          return expirationDate < today;
        } catch (error) {
          return false;
        }
      });
      
      setFilteredExpired(expiredProducts);
    }
  }, [medications, search]);

  // Formatear fecha para mostrar
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
      return "Fecha inválida";
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return `C$${parseFloat(price || 0).toFixed(2)}`;
  };

  // Calcular días desde expiración
  const calculateDaysExpired = (expirationDate) => {
    if (!expirationDate) return 0;
    
    try {
      const expDate = new Date(expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today - expDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  // Mostrar notificación
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Manejar eliminación de producto
  const handleDelete = async (medicationID, medicationName) => {
    if (confirmDelete !== medicationID) {
      setConfirmDelete(medicationID);
      return;
    }

    setIsDeleting({ ...isDeleting, [medicationID]: true });
    
    try {
      const result = await deleteMedication(medicationID);
      
      if (result.success) {
        showNotification(`Producto "${medicationName}" eliminado correctamente`, "success");
        await loadMedications(); // Recargar la lista
      } else {
        showNotification(result.error || "Error al eliminar producto", "error");
      }
    } catch (error) {
      console.error("Error eliminando producto:", error);
      showNotification("Error de conexión", "error");
    } finally {
      setIsDeleting({ ...isDeleting, [medicationID]: false });
      setConfirmDelete(null);
    }
  };

  // Cancelar confirmación de eliminación
  const cancelDelete = (medicationID) => {
    setConfirmDelete(null);
  };

  // Cargando estado
  if (!medications) {
    return (
      <div className="expired-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Cargando productos caducados...</p>
        </div>
      </div>
    );
  }

  // Obtener fecha actual para mostrar
  const currentDate = new Date().toLocaleDateString('es-NI', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="expired-container">
      {/* Encabezado */}
      <div className="expired-header">
        <div className="header-left">
          <h2>
            <FontAwesomeIcon icon={faExclamationTriangle} className="header-icon" />
            Productos Caducados
          </h2>
          <p className="subtitle">
            Productos cuya fecha de expiración ha pasado - {currentDate}
          </p>
        </div>
        <div className="header-right">
          <div className="expired-count">
            <span className="count-number">{filteredExpired.length}</span>
            <span className="count-label">productos caducados</span>
          </div>
        </div>
      </div>

      {/* Notificación de advertencia */}
      <div className="expired-warning">
        <FontAwesomeIcon icon={faExclamationCircle} />
        <span>
          Estos productos ya han pasado su fecha de expiración y no deben ser vendidos.
        </span>
      </div>

      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <FontAwesomeIcon icon={notification.type === "success" ? faCheck : faExclamationCircle} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="expired-search-section">
        <div className="search-wrapper">
          <input
            className="search-box"
            placeholder="Buscar producto caducado..."
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
            Mostrando {filteredExpired.length} de {
              medications.filter(m => {
                if (!m.ExpirationDate) return false;
                try {
                  const expDate = new Date(m.ExpirationDate);
                  const today = new Date();
                  return expDate < today;
                } catch (error) {
                  return false;
                }
              }).length
            } productos caducados
          </span>
        </div>
      </div>

      {/* Sección de tabla */}
      <div className="expired-section">
        {filteredExpired.length === 0 ? (
          <div className="no-expired-message">
            <div className="no-expired-icon">
              {search ? (
                <>
                  <FontAwesomeIcon icon={faSearch} />
                  <h3>No se encontraron productos caducados</h3>
                  <p>No hay productos caducados que coincidan con "{search}"</p>
                  <button 
                    className="btn-clear-search"
                    onClick={() => setSearch("")}
                  >
                    Mostrar todos los productos caducados
                  </button>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} />
                  <h3>¡Excelentes noticias!</h3>
                  <p>No hay productos caducados en el inventario.</p>
                  <p className="sub-message">Todos los productos están vigentes.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="expired-table">
              <thead>
                <tr>
                  <th>Nombre del Producto</th>
                  <th>Cantidad en Stock</th>
                  <th>Precio Unitario</th>
                  <th>Fecha de Expiración</th>
                  <th>Días Caducado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpired.map(product => {
                  const daysExpired = calculateDaysExpired(product.ExpirationDate);
                  const isDeletingProduct = isDeleting[product.medicationID];
                  const needsConfirm = confirmDelete === product.medicationID;
                  
                  return (
                    <tr key={product.medicationID} className="expired-row">
                      {/* Nombre */}
                      <td>
                        <div className="product-name-display">
                          <FontAwesomeIcon icon={faBox} className="product-icon" />
                          <span className="product-name">{product.Name || "Sin nombre"}</span>
                        </div>
                      </td>
                      
                      {/* Cantidad */}
                      <td>
                        <div className="amount-display">
                          <span className="amount-badge expired-badge">
                            {product.Amount || 0} unidades
                          </span>
                        </div>
                      </td>
                      
                      {/* Precio */}
                      <td>
                        <div className="price-display">
                          <span className="price-value expired-price">
                            {formatPrice(product.Price)}
                          </span>
                        </div>
                      </td>
                      
                      {/* Fecha de Expiración */}
                      <td>
                        <div className="expiration-display">
                          <FontAwesomeIcon icon={faCalendarTimes} className="expired-icon" />
                          <span className="expiration-date expired">
                            {formatDateForDisplay(product.ExpirationDate)}
                          </span>
                        </div>
                      </td>
                      
                      {/* Días Caducado */}
                      <td>
                        <div className="days-expired-display">
                          <span className={`days-badge ${daysExpired > 30 ? "critical" : daysExpired > 7 ? "warning" : "recent"}`}>
                            {daysExpired} día{daysExpired !== 1 ? "s" : ""}
                          </span>
                          {daysExpired > 30 && (
                            <span className="critical-warning">Crítico</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Acciones - Eliminar */}
                      <td>
                        <div className="action-buttons">
                          {needsConfirm ? (
                            <div className="confirm-delete">
                              <span className="confirm-text">¿Eliminar?</span>
                              <button
                                className="confirm-btn"
                                onClick={() => handleDelete(product.medicationID, product.Name)}
                                disabled={isDeletingProduct}
                              >
                                {isDeletingProduct ? (
                                  <>
                                    <div className="mini-spinner"></div>
                                    <span>Eliminando...</span>
                                  </>
                                ) : (
                                  <>
                                    <FontAwesomeIcon icon={faCheck} />
                                    <span>Sí</span>
                                  </>
                                )}
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={() => cancelDelete(product.medicationID)}
                                disabled={isDeletingProduct}
                              >
                                <FontAwesomeIcon icon={faTimes} />
                                <span>No</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="delete-btn"
                              onClick={() => setConfirmDelete(product.medicationID)}
                              disabled={isDeletingProduct}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              <span>Eliminar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      {filteredExpired.length > 0 && (
        <div className="expired-info-section">
          <div className="info-card critical-info">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <div>
              <h4>¡Atención!</h4>
              <p>
                Los productos caducados no deben ser vendidos bajo ninguna circunstancia.
                Elimínalos del inventario para mantener la calidad del servicio.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}