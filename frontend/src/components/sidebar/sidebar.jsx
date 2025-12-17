import "./sidebar.css";

export default function Sidebar({ setPage, active, setActive, currentPage }) {
  const handleClick = (pageName) => {
    setPage(pageName);
    // Cerrar sidebar en móviles después de hacer clic
    if (window.innerWidth < 768) {
      setActive(false);
    }
  };

  return (
    <aside className={`sidebar ${active ? 'active' : ''}`}>
      <div className="sidebar-logo">
        <h2>Farmacia Sory</h2>
      </div>
      
      <button 
        className={currentPage === "medications" ? "active" : ""}
        onClick={() => handleClick("medications")}
      >
        Productos
      </button>
      
      <button 
        className={currentPage === "edit-medications" ? "active" : ""}
        onClick={() => handleClick("edit-medications")}
      >
        Editar Productos
      </button>
      
      <button 
        className={currentPage === "sales" ? "active" : ""}
        onClick={() => handleClick("sales")}
      >
        Ventas
      </button>
      
      <button 
        className={currentPage === "entries" ? "active" : ""}
        onClick={() => handleClick("entries")}
      >
        Entradas
      </button>
      
      <button 
        className={currentPage === "expired" ? "active" : ""}
        onClick={() => handleClick("expired")}
      >
        Caducados
      </button>
    </aside>
  );
}