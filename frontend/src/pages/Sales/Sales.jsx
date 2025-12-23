import { useEffect, useState, useMemo, useContext } from "react";
import "./Sales.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCashRegister, 
  faCalendarDay, 
  faFilter, 
  faTimes, 
  faChevronUp, 
  faChevronDown,
  faBox,
  faReceipt,
  faMoneyBillWave,
  faShoppingCart,
  faCalendarWeek,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { AppContext } from "../../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL;

// Opciones de filtro de tiempo
const TIME_FILTERS = {
  TODAY: 'hoy',
  LAST_7_DAYS: '7dias',
  LAST_30_DAYS: '30dias',
  ALL: 'todos'
};

export default function Sales() {
  const { medications, formatNicaraguaDate, formatNicaraguaTime, formatNicaraguaDateTime } = useContext(AppContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS.TODAY);
  const [showDateFilter, setShowDateFilter] = useState(true);
  const [expandedSales, setExpandedSales] = useState({});

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/movements`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Filtrar solo salidas/ventas
      const filtered = data
        .filter(m => {
          const type = m.Type || m.type;
          return type?.toLowerCase() === "salida";
        })
        .sort((a, b) => {
          const dateA = new Date(a.MovementDate || a.movementDate);
          const dateB = new Date(b.MovementDate || b.movementDate);
          return dateB - dateA;
        });
      
      setSales(filtered);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el precio de un medicamento por su ID
  const getMedicationPrice = (medicationID) => {
    const medication = medications.find(m => m.medicationID === medicationID);
    return medication ? (medication.Price || 0) : 0;
  };

  // Función para obtener el nombre de un medicamento por su ID
  const getMedicationName = (medicationID) => {
    const medication = medications.find(m => m.medicationID === medicationID);
    return medication ? (medication.Name || "Producto desconocido") : "Producto desconocido";
  };

  // Función para agrupar ventas por transacción (mismo minuto)
  const groupSalesByMinute = (salesData) => {
    if (salesData.length === 0) return [];
    
    const groups = [];
    let currentGroup = null;
    
    // Ordenar ventas por fecha
    const sortedSales = [...salesData].sort((a, b) => {
      const dateA = new Date(a.MovementDate);
      const dateB = new Date(b.MovementDate);
      return dateA - dateB;
    });
    
    sortedSales.forEach((sale, index) => {
      const saleDate = new Date(sale.MovementDate);
      const saleMinute = new Date(
        saleDate.getFullYear(),
        saleDate.getMonth(),
        saleDate.getDate(),
        saleDate.getHours(),
        saleDate.getMinutes()
      ).getTime();
      
      const price = getMedicationPrice(sale.medicationID);
      const itemTotal = price * (sale.Amount || 0);
      
      if (!currentGroup || saleMinute !== currentGroup.transactionMinute) {
        // Crear nuevo grupo
        if (currentGroup) {
          groups.push(currentGroup);
        }
        
        currentGroup = {
          transactionId: `venta-${saleMinute}-${index}`,
          transactionDate: saleDate,
          transactionMinute: saleMinute,
          items: [],
          totalProducts: 0,
          totalUniqueProducts: 0,
          totalAmount: 0
        };
      }
      
      // Agregar ítem al grupo actual
      currentGroup.items.push({
        ...sale,
        productName: getMedicationName(sale.medicationID),
        price: price,
        itemTotal: itemTotal
      });
      
      currentGroup.totalProducts += Number(sale.Amount || 0);
      currentGroup.totalAmount += itemTotal;
    });
    
    // Agregar el último grupo
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    // Calcular productos únicos por transacción y ordenar por fecha descendente
    groups.forEach(group => {
      const uniqueProducts = new Set(
        group.items.map(item => item.productName)
      );
      group.totalUniqueProducts = uniqueProducts.size;
    });
    
    return groups.sort((a, b) => b.transactionDate - a.transactionDate);
  };

  // Aplicar filtro de tiempo a las ventas
  const applyTimeFilter = (salesData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case TIME_FILTERS.TODAY:
        return salesData.filter(sale => {
          const saleDate = new Date(sale.MovementDate);
          return saleDate >= today;
        });
        
      case TIME_FILTERS.LAST_7_DAYS:
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        return salesData.filter(sale => {
          const saleDate = new Date(sale.MovementDate);
          return saleDate >= last7Days;
        });
        
      case TIME_FILTERS.LAST_30_DAYS:
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        return salesData.filter(sale => {
          const saleDate = new Date(sale.MovementDate);
          return saleDate >= last30Days;
        });
        
      default:
        return salesData;
    }
  };

  // Ventas agrupadas y filtradas
  const groupedSales = useMemo(() => {
    let filteredSales = applyTimeFilter(sales);
    
    // Aplicar filtro de fecha específica si existe
    if (selectedDate) {
      filteredSales = filteredSales.filter(sale => 
        formatShortDate(sale.MovementDate) === selectedDate
      );
    }
    
    return groupSalesByMinute(filteredSales);
  }, [sales, medications, timeFilter, selectedDate]);

  // Funciones de formato usando el contexto
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const toggleExpandSale = (transactionId) => {
    setExpandedSales(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
  };

  // Calcular estadísticas basadas en las ventas filtradas
  const stats = useMemo(() => {
    const totalSales = groupedSales.length;
    const totalProductsSold = groupedSales.reduce((sum, group) => 
      sum + group.totalProducts, 0
    );
    const totalTransactions = groupedSales.reduce((sum, group) => 
      sum + group.items.length, 0
    );
    const totalRevenue = groupedSales.reduce((sum, group) => 
      sum + group.totalAmount, 0
    );
    
    return {
      totalSales,
      totalProductsSold,
      totalTransactions,
      totalRevenue
    };
  }, [groupedSales]);

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
      <div className="sales-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando historial de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-container">
      <div className="sales-header">
        <div className="header-left">
          <h2>
            <FontAwesomeIcon icon={faCashRegister} className="header-icon" />
            Historial de Ventas
          </h2>
          <p className="subtitle">Registro de transacciones de venta realizadas</p>
        </div>
        <div className="header-right">
          <div className="sales-count">
            <span className="count-number">{stats.totalSales}</span>
            <span className="count-label">ventas totales</span>
          </div>
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowDateFilter(!showDateFilter)}
          >
            <FontAwesomeIcon icon={faFilter} />
            {showDateFilter ? 'Ocultar filtros' : 'Filtrar ventas'}
          </button>
        </div>
      </div>

      {/* Filtros de tiempo y fecha */}
      {showDateFilter && (
        <div className="date-filter-section">
          <div className="date-filter-header">
            <h3>
              <FontAwesomeIcon icon={faFilter} />
              Filtrar ventas
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
                Todas las ventas
              </button>
            </div>
          </div>
          
          <div className="specific-date-controls">
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
                <>Mostrando ventas del: <strong>{selectedDate}</strong></>
              ) : (
                <>Mostrando ventas: <strong>
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
      <div className="sales-stats">
        <div className="stat-card revenue">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Ingresos Totales</div>
          </div>
        </div>
        
        <div className="stat-card transactions">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faReceipt} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSales}</div>
            <div className="stat-label">Transacciones</div>
          </div>
        </div>
        
        <div className="stat-card products">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faBox} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProductsSold}</div>
            <div className="stat-label">Productos Vendidos</div>
          </div>
        </div>
        
        <div className="stat-card items">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faShoppingCart} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalTransactions}</div>
            <div className="stat-label">Ítems Vendidos</div>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      {groupedSales.length === 0 ? (
        <div className="no-sales">
          <div className="no-sales-icon">
            <FontAwesomeIcon icon={faCashRegister} />
          </div>
          <h3>No hay ventas registradas</h3>
          <p>
            {selectedDate 
              ? `No se encontraron ventas para la fecha ${selectedDate}`
              : timeFilter === TIME_FILTERS.TODAY 
                ? 'No hay ventas registradas hoy'
                : timeFilter === TIME_FILTERS.LAST_7_DAYS 
                  ? 'No hay ventas en los últimos 7 días'
                  : timeFilter === TIME_FILTERS.LAST_30_DAYS 
                    ? 'No hay ventas en los últimos 30 días'
                    : 'No hay ventas registradas en el sistema'
            }
          </p>
        </div>
      ) : (
        <div className="sales-list">
          {groupedSales.map(group => (
            <div key={group.transactionId} className="sale-card">
              <div 
                className="sale-card-header"
                onClick={() => toggleExpandSale(group.transactionId)}
              >
                <div className="sale-header-info">
                  <div className="sale-date-time">
                    <h3 className="sale-main-date">{formatNicaraguaDateTime(group.transactionDate)}</h3>
                    <span className="sale-day">{formatDayName(group.transactionDate)}</span>
                  </div>
                  <div className="sale-header-summary">
                    <span className="sale-total-amount">{formatCurrency(group.totalAmount)}</span>
                    <FontAwesomeIcon 
                      icon={expandedSales[group.transactionId] ? faChevronUp : faChevronDown} 
                      className="expand-icon"
                    />
                  </div>
                </div>
              </div>
              
              {expandedSales[group.transactionId] && (
                <div className="sale-card-details">
                  <div className="sale-items-section">
                    <h4 className="sale-items-title">Productos vendidos:</h4>
                    <div className="sale-items-list">
                      {group.items.map((item, index) => (
                        <div key={`${item.movementID}-${index}`} className="sale-item">
                          <div className="sale-item-main">
                            <div className="sale-item-name">{item.productName}</div>
                            <div className="sale-item-quantity">{item.Amount} unidades</div>
                          </div>
                          <div className="sale-item-prices">
                            <div className="sale-item-unit-price">
                              <span>Precio unitario:</span>
                              <span>{formatCurrency(item.price)}</span>
                            </div>
                            <div className="sale-item-subtotal">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(item.itemTotal)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="sale-total-section">
                    <div className="sale-summary-row">
                      <span>Total productos:</span>
                      <span>{group.totalProducts} unidades</span>
                    </div>
                    <div className="sale-summary-row">
                      <span>Productos diferentes:</span>
                      <span>{group.totalUniqueProducts}</span>
                    </div>
                    <div className="sale-summary-row grand-total">
                      <span>Total de la venta:</span>
                      <span>{formatCurrency(group.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}