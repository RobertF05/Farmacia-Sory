import { useEffect, useState, useMemo } from "react";
import "./Entries.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxOpen, 
  faCalendarDay, 
  faFilter, 
  faTimes, 
  faChevronUp, 
  faChevronDown,
  faBoxes,
  faPlusCircle,
  faSyncAlt,
  faCalendarWeek,
  faCalendarAlt,
  faStar,
  faBox
} from '@fortawesome/free-solid-svg-icons';

const API_URL = import.meta.env.VITE_API_URL;

// Opciones de filtro de tiempo
const TIME_FILTERS = {
  TODAY: 'hoy',
  LAST_7_DAYS: '7dias',
  LAST_30_DAYS: '30dias',
  ALL: 'todos'
};

// Tipos de entradas
const ENTRY_TYPES = {
  NUEVO: 'nuevo',
  ENTRADA: 'entrada',
  REPOSICION: 'reposicion'
};

export default function Entries() {
  const [entries, setEntries] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS.TODAY);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState({});

  useEffect(() => {
    Promise.all([fetchEntries(), fetchMedications()]);
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/movements`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Filtrar todos los tipos de entradas (nuevo, entrada, reposicion)
      const filtered = data
        .filter(m => {
          const type = m.Type || m.type;
          const typeLower = type?.toLowerCase();
          return typeLower === "nuevo" || typeLower === "entrada" || typeLower === "reposicion";
        })
        .sort((a, b) => {
          const dateA = new Date(a.MovementDate || a.movementDate);
          const dateB = new Date(b.MovementDate || b.movementDate);
          return dateB - dateA;
        });
      
      setEntries(filtered);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const res = await fetch(`${API_URL}/medications`);
      if (res.ok) {
        const data = await res.json();
        setMedications(data);
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

  // Función para obtener el nombre de un medicamento por su ID
  const getMedicationName = (medicationID) => {
    const medication = medications.find(m => m.medicationID === medicationID);
    return medication ? (medication.Name || "Producto desconocido") : "Producto desconocido";
  };

  // Función para determinar el tipo de entrada basado en el Type del movimiento
  const getEntryType = (entry) => {
    const type = entry.Type || entry.type;
    const typeLower = type?.toLowerCase();
    
    if (typeLower === "nuevo") {
      return ENTRY_TYPES.NUEVO;
    } else if (typeLower === "entrada") {
      return ENTRY_TYPES.ENTRADA;
    } else if (typeLower === "reposicion") {
      return ENTRY_TYPES.REPOSICION;
    }
    
    // Si no tiene type, intentar determinar si es nuevo o reposición
    const medication = medications.find(m => m.medicationID === entry.medicationID);
    
    if (!medication) {
      return ENTRY_TYPES.NUEVO;
    }
    
    // Verificar si el medicamento fue creado antes de este movimiento
    const medicationAddDate = new Date(medication.AddDate || medication.addDate || medication.createdAt);
    const entryDate = new Date(entry.MovementDate);
    
    // Si la diferencia es pequeña (menos de 1 minuto), consideramos que es nuevo
    const timeDiff = Math.abs(entryDate - medicationAddDate);
    return timeDiff > 60000 ? ENTRY_TYPES.REPOSICION : ENTRY_TYPES.NUEVO;
  };

  // Función para obtener el tipo de entrada en texto
  const getEntryTypeText = (entry) => {
    const type = getEntryType(entry);
    switch (type) {
      case ENTRY_TYPES.NUEVO:
        return "Producto Nuevo";
      case ENTRY_TYPES.ENTRADA:
        return "Entrada de Stock";
      case ENTRY_TYPES.REPOSICION:
        return "Reposición de Stock";
      default:
        return "Entrada";
    }
  };

  // Función para obtener el icono según el tipo de entrada
  const getEntryTypeIcon = (entry) => {
    const type = getEntryType(entry);
    switch (type) {
      case ENTRY_TYPES.NUEVO:
        return faStar;
      case ENTRY_TYPES.ENTRADA:
        return faBoxOpen;
      case ENTRY_TYPES.REPOSICION:
        return faSyncAlt;
      default:
        return faBox;
    }
  };

  // Función para obtener el color según el tipo de entrada
  const getEntryTypeColor = (entry) => {
    const type = getEntryType(entry);
    switch (type) {
      case ENTRY_TYPES.NUEVO:
        return "#805ad5"; // Morado para producto nuevo
      case ENTRY_TYPES.ENTRADA:
        return "#3182ce"; // Azul para entrada
      case ENTRY_TYPES.REPOSICION:
        return "#38a169"; // Verde para reposición
      default:
        return "#38a169";
    }
  };

  // Aplicar filtro de tiempo a las entradas
  const applyTimeFilter = (entriesData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case TIME_FILTERS.TODAY:
        return entriesData.filter(entry => {
          const entryDate = new Date(entry.MovementDate);
          return entryDate >= today;
        });
        
      case TIME_FILTERS.LAST_7_DAYS:
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        return entriesData.filter(entry => {
          const entryDate = new Date(entry.MovementDate);
          return entryDate >= last7Days;
        });
        
      case TIME_FILTERS.LAST_30_DAYS:
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        return entriesData.filter(entry => {
          const entryDate = new Date(entry.MovementDate);
          return entryDate >= last30Days;
        });
        
      default:
        return entriesData;
    }
  };

  // Entradas filtradas
  const filteredEntries = useMemo(() => {
    let filtered = applyTimeFilter(entries);
    
    // Aplicar filtro de fecha específica si existe
    if (selectedDate) {
      filtered = filtered.filter(entry => 
        formatShortDate(entry.MovementDate) === selectedDate
      );
    }
    
    return filtered;
  }, [entries, timeFilter, selectedDate]);

  // Funciones de formato
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha inválida";
      
      return date.toLocaleDateString('es-NI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      return date.toLocaleDateString('es-NI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return "";
    }
  };

  const formatDayName = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      return date.toLocaleDateString('es-NI', { weekday: 'long' });
    } catch (error) {
      return "";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      return date.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "";
    }
  };

  const toggleExpandEntry = (entryId) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  // Calcular estadísticas basadas en las entradas filtradas
  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const totalProducts = filteredEntries.reduce((sum, entry) => 
      sum + (entry.Amount || 0), 0
    );
    const newProducts = filteredEntries.filter(entry => 
      getEntryType(entry) === ENTRY_TYPES.NUEVO
    ).length;
    const entradaProducts = filteredEntries.filter(entry => 
      getEntryType(entry) === ENTRY_TYPES.ENTRADA
    ).length;
    const restockProducts = filteredEntries.filter(entry => 
      getEntryType(entry) === ENTRY_TYPES.REPOSICION
    ).length;
    
    return {
      totalEntries,
      totalProducts,
      newProducts,
      entradaProducts,
      restockProducts
    };
  }, [filteredEntries]);

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    setSelectedDate(null); // Limpiar filtro de fecha específica al cambiar filtro de tiempo
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setTimeFilter(TIME_FILTERS.ALL); // Cambiar a "todos" al seleccionar fecha específica
  };

  const clearFilters = () => {
    setSelectedDate(null);
    setTimeFilter(TIME_FILTERS.TODAY);
  };

  if (loading) {
    return (
      <div className="entries-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando historial de entradas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="entries-container">
      <div className="entries-header">
        <div className="header-left">
          <h2>
            <FontAwesomeIcon icon={faBoxOpen} className="header-icon" />
            Historial de Entradas
          </h2>
          <p className="subtitle">Registro de productos añadidos al inventario</p>
        </div>
        <div className="header-right">
          <div className="entries-count">
            <span className="count-number">{stats.totalEntries}</span>
            <span className="count-label">entradas totales</span>
          </div>
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowDateFilter(!showDateFilter)}
          >
            <FontAwesomeIcon icon={faFilter} />
            {showDateFilter ? 'Ocultar filtros' : 'Filtrar entradas'}
          </button>
        </div>
      </div>

      {/* Filtros de tiempo y fecha */}
      {showDateFilter && (
        <div className="date-filter-section">
          <div className="date-filter-header">
            <h3>
              <FontAwesomeIcon icon={faFilter} />
              Filtrar entradas
            </h3>
            <button 
              className="close-filter-btn"
              onClick={() => setShowDateFilter(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="time-filter-controls">
            <div className="time-filter-buttons">
              <button 
                className={`time-filter-btn ${timeFilter === TIME_FILTERS.TODAY ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange(TIME_FILTERS.TODAY)}
              >
                <FontAwesomeIcon icon={faCalendarDay} />
                Hoy
              </button>
              <button 
                className={`time-filter-btn ${timeFilter === TIME_FILTERS.LAST_7_DAYS ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange(TIME_FILTERS.LAST_7_DAYS)}
              >
                <FontAwesomeIcon icon={faCalendarWeek} />
                Últimos 7 días
              </button>
              <button 
                className={`time-filter-btn ${timeFilter === TIME_FILTERS.LAST_30_DAYS ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange(TIME_FILTERS.LAST_30_DAYS)}
              >
                <FontAwesomeIcon icon={faCalendarAlt} />
                Últimos 30 días
              </button>
              <button 
                className={`time-filter-btn ${timeFilter === TIME_FILTERS.ALL ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange(TIME_FILTERS.ALL)}
              >
                Todas las entradas
              </button>
            </div>
          </div>
          
          <div className="specific-date-controls">
            <div className="date-input-group">
              <label htmlFor="date-picker">Fecha específica:</label>
              <input
                type="date"
                id="date-picker"
                value={selectedDate || ''}
                onChange={(e) => handleDateSelect(e.target.value)}
              />
            </div>
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <FontAwesomeIcon icon={faTimes} />
              Limpiar filtros
            </button>
          </div>
          
          {(selectedDate || timeFilter !== TIME_FILTERS.TODAY) && (
            <div className="filter-indicator">
              {selectedDate ? (
                <>Mostrando entradas del: <strong>{selectedDate}</strong></>
              ) : (
                <>Mostrando entradas: <strong>
                  {timeFilter === TIME_FILTERS.TODAY && 'de hoy'}
                  {timeFilter === TIME_FILTERS.LAST_7_DAYS && 'de los últimos 7 días'}
                  {timeFilter === TIME_FILTERS.LAST_30_DAYS && 'de los últimos 30 días'}
                  {timeFilter === TIME_FILTERS.ALL && 'todas'}
                </strong></>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="entries-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">Entradas Totales</div>
          </div>
        </div>
        
        <div className="stat-card products">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faBoxes} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Productos Agregados</div>
          </div>
        </div>
        
        <div className="stat-card new">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faStar} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.newProducts}</div>
            <div className="stat-label">Productos Nuevos</div>
          </div>
        </div>
        
        <div className="stat-card entrada">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faBox} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.entradaProducts}</div>
            <div className="stat-label">Entradas de Stock</div>
          </div>
        </div>
        
        <div className="stat-card restock">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faSyncAlt} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.restockProducts}</div>
            <div className="stat-label">Reposiciones</div>
          </div>
        </div>
      </div>

      {/* Lista de entradas */}
      {filteredEntries.length === 0 ? (
        <div className="no-entries">
          <div className="no-entries-icon">
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <h3>No hay entradas registradas</h3>
          <p>
            {selectedDate 
              ? `No se encontraron entradas para la fecha ${selectedDate}`
              : timeFilter === TIME_FILTERS.TODAY 
                ? 'No hay entradas registradas hoy'
                : timeFilter === TIME_FILTERS.LAST_7_DAYS 
                  ? 'No hay entradas en los últimos 7 días'
                  : timeFilter === TIME_FILTERS.LAST_30_DAYS 
                    ? 'No hay entradas en los últimos 30 días'
                    : 'No hay entradas registradas en el sistema'
            }
          </p>
        </div>
      ) : (
        <div className="entries-list">
          {filteredEntries.map((entry, index) => {
            const entryId = `entry-${entry.movementID || entry.id || index}`;
            const entryType = getEntryType(entry);
            const entryTypeText = getEntryTypeText(entry);
            const entryTypeIcon = getEntryTypeIcon(entry);
            const entryTypeColor = getEntryTypeColor(entry);
            
            return (
              <div key={entryId} className="entry-card">
                <div 
                  className="entry-card-header"
                  onClick={() => toggleExpandEntry(entryId)}
                  style={{ borderLeftColor: entryTypeColor }}
                >
                  <div className="entry-header-info">
                    <div className="entry-date-time">
                      <h3 className="entry-main-date">{formatDate(entry.MovementDate)}</h3>
                      <span className="entry-day">{formatDayName(entry.MovementDate)}</span>
                    </div>
                    <div className="entry-header-summary">
                      <div className="entry-type-badge" style={{ backgroundColor: `${entryTypeColor}15`, color: entryTypeColor }}>
                        <FontAwesomeIcon icon={entryTypeIcon} />
                        <span>{entryTypeText}</span>
                      </div>
                      <div className="entry-amount-display">
                        <span className="amount-badge" style={{ backgroundColor: entryTypeColor }}>
                          +{entry.Amount || 0}
                        </span>
                        <FontAwesomeIcon 
                          icon={expandedEntries[entryId] ? faChevronUp : faChevronDown} 
                          className="expand-icon"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {expandedEntries[entryId] && (
                  <div className="entry-card-details">
                    <div className="entry-details-section">
                      <h4 className="entry-details-title">Detalles de la entrada:</h4>
                      
                      <div className="entry-detail-row">
                        <div className="entry-detail-label">Producto:</div>
                        <div className="entry-detail-value">
                          {getMedicationName(entry.medicationID)}
                        </div>
                      </div>
                      
                      <div className="entry-detail-row">
                        <div className="entry-detail-label">Tipo de entrada:</div>
                        <div className="entry-detail-value">
                          <span className="entry-type-display" style={{ color: entryTypeColor }}>
                            <FontAwesomeIcon icon={entryTypeIcon} />
                            {entryTypeText}
                          </span>
                        </div>
                      </div>
                      
                      <div className="entry-detail-row">
                        <div className="entry-detail-label">Cantidad agregada:</div>
                        <div className="entry-detail-value highlight" style={{ color: entryTypeColor }}>
                          +{entry.Amount || 0} unidades
                        </div>
                      </div>
                      
                      {entry.ExpirationDate && (
                        <div className="entry-detail-row">
                          <div className="entry-detail-label">Fecha de expiración:</div>
                          <div className="entry-detail-value">
                            {formatShortDate(entry.ExpirationDate)}
                          </div>
                        </div>
                      )}
                      
                      <div className="entry-detail-row">
                        <div className="entry-detail-label">Fecha de registro:</div>
                        <div className="entry-detail-value">
                          {formatDate(entry.MovementDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="entry-summary-section">
                      <div className="entry-summary-row">
                        <span>Resumen:</span>
                        <span>{entry.Amount || 0} unidades agregadas</span>
                      </div>
                      <div className="entry-summary-row">
                        <span>Tipo:</span>
                        <span style={{ color: entryTypeColor, fontWeight: '600' }}>
                          <FontAwesomeIcon icon={entryTypeIcon} style={{ marginRight: '0.5rem' }} />
                          {entryTypeText}
                        </span>
                      </div>
                      {entryType === ENTRY_TYPES.NUEVO && (
                        <div className="entry-summary-row highlight-new">
                          <span>✨ Producto agregado por primera vez al inventario</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}