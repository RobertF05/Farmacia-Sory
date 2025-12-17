import "./sidebar.css";

export default function Sidebar({ setPage }) {
  return (
    <aside className="sidebar">
      <button onClick={() => setPage("medications")}>Productos</button>
      <button onClick={() => setPage("edit-medications")}>
        Editar Productos
      </button>
      <button onClick={() => setPage("sales")}>Ventas</button>
      <button onClick={() => setPage("entries")}>Entradas</button>
      <button onClick={() => setPage("expired")}>Caducados</button>
    </aside>
  );
}
