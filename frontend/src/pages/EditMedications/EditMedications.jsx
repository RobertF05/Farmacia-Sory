import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import "./EditMedications.css";

export default function EditMedications() {
  const { medications } = useContext(AppContext);

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

  // Función para formatear precio
  const formatPrice = (price) => {
    return `C$${parseFloat(price || 0).toFixed(2)}`;
  };

  return (
    <div className="edit-medications-container">
      {/* Encabezado */}
      <div className="edit-header">
        <h2>Editar Productos</h2>
        <div className="edit-count">
          <span>{medications.length}</span>
          <span>productos</span>
        </div>
      </div>

      {/* Sección de tabla */}
      <div className="edit-section">
        {medications.length === 0 ? (
          <div className="no-products-message">
            <p>No hay productos disponibles para editar.</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="edit-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {medications.map(m => (
                  <tr key={m.medicationID}>
                    <td style={{ color: "black", fontWeight: "500" }}>{m.Name || "Sin nombre"}</td>
                    <td style={{ color: m.Amount < 10 ? "var(--warning)" : "inherit" }}>
                      {m.Amount || 0}
                    </td>
                    <td style={{ color: "black", fontWeight: "500" }}>
                      {formatPrice(m.Price)}
                    </td>
                    <td>
                      <button className="edit-btn">Editar</button>
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