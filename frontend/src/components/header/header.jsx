import "./header.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function Header({ toggleSidebar, sidebarActive }) {
  return (
    <header className="header">
      {/* Botón hamburguesa a la izquierda */}
      <button 
        className="menu-toggle-btn"
        onClick={toggleSidebar}
        aria-label={sidebarActive ? "Cerrar menú" : "Abrir menú"}
      >
        <FontAwesomeIcon icon={sidebarActive ? faTimes : faBars} />
      </button>
      
      {/* Logo/Título centrado */}
      <div className="header-center">
        <h1>Farmacia Sory</h1>
      </div>
      
      {/* Espacio a la derecha para balancear */}
      <div className="header-right"></div>
    </header>
  );
}