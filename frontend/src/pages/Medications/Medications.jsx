import { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import "./Medications.css";

export default function Medications() {
  const { medications } = useContext(AppContext);
  const [search, setSearch] = useState("");

  // Manejar el caso cuando medications es undefined
  if (!medications) {
    return (
      <div className="medications-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Cargando medicamentos...</p>
        </div>
      </div>
    );
  }

  const filtered = medications.filter(m =>
    m.Name?.toLowerCase().includes(search.toLowerCase())
  );

  // Función para determinar clase de cantidad
  const getStockClass = (amount) => {
    if (amount < 10) return "low-stock";
    return "normal-stock";
  };

  // Función para determinar clase de fecha de expiración
  const getExpirationClass = (dateString) => {
    if (!dateString) return "";
    
    const expirationDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    if (expirationDate < today) return "expired";
    if (expirationDate <= thirtyDaysFromNow) return "expiring-soon";
    return "";
  };

  // Función para formatear precio
  const formatPrice = (price) => {
    return `C$${parseFloat(price || 0).toFixed(2)}`;
  };

  return (
    <div className="medications-container">
      {/* Encabezado */}
      <div className="medications-header">
        <h2>Medicamentos</h2>
        <div className="medications-tools">
          <div className="search-wrapper">
            <input
              className="search-box"
              placeholder="Buscar medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="gray" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
            </svg>
          </div>
          
          {search && (
            <button 
              className="btn-clear-filters" 
              onClick={() => setSearch("")}
              title="Limpiar búsqueda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </button>
          )}
          
          <div className="medications-count">
            <span>{filtered.length}</span>
            <span>/</span>
            <span>{medications.length}</span>
          </div>
        </div>
      </div>

      {/* Sección de tabla */}
      <div className="medications-section">
        <h3>Inventario de Medicamentos</h3>
        
        {filtered.length === 0 ? (
          <div className="no-results">
            <p>
              {search 
                ? "No se encontraron medicamentos que coincidan con la búsqueda." 
                : "No hay medicamentos registrados."}
            </p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="medications-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Fecha de Expiración</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, index) => (
                  <tr key={m.medicationID}>
                    <td style={{ color: "black", fontWeight: "500" }}>{m.Name || "Sin nombre"}</td>
                    <td className={getStockClass(m.Amount)}>
                      {m.Amount || 0}
                    </td>
                    <td style={{ color: "black", fontWeight: "500" }}>
                      {formatPrice(m.Price)}
                    </td>
                    <td className={getExpirationClass(m.ExpirationDate)}>
                      {m.ExpirationDate || "No especificada"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}