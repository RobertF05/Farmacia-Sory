import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faEdit, 
  faCashRegister, 
  faBoxOpen, 
  faCalendarTimes,
  faSignOutAlt,
  faHome,
  faPills
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ setPage, active, setActive, currentPage }) => {
  const { logout } = useContext(AuthContext);

  const menuItems = [
    { 
      id: 'medications', 
      label: 'Medicamentos', 
      icon: faPills
    },
    { 
      id: 'edit-medications', 
      label: 'Editor Medicamentos', 
      icon: faEdit
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: faCashRegister
    },
    { 
      id: 'entries', 
      label: 'Entradas', 
      icon: faBoxOpen
    },
    { 
      id: 'expired', 
      label: 'Productos Vencidos', 
      icon: faCalendarTimes
    }
  ];

  const handleNavigation = (pageId) => {
    setPage(pageId);
    // En móviles, cerrar sidebar después de seleccionar
    if (window.innerWidth <= 768) {
      setActive(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Overlay para móviles */}
      {active && window.innerWidth <= 768 && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setActive(false)}
        />
      )}
      
      <aside className={`sidebar ${active ? 'active' : ''}`}>
        <nav className="sidebar-nav">
          <div className="sidebar-header">
            <button 
              className="sidebar-close-btn"
              onClick={() => setActive(false)}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
            <div className="sidebar-logo">
              <h2>💊 Farmacia Sory</h2>
              <p className="sidebar-subtitle">Gestión Farmacéutica</p>
            </div>
          </div>
          
          <ul className="sidebar-menu">
            
            {menuItems.map((item) => (
              <li key={item.id} className="sidebar-menu-item">
                <button
                  className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.id)}
                >
                  <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
                  <span>{item.label}</span>
                </button>
                
                {/* Submenús */}
                {item.subItems && (
                  <ul className="sidebar-submenu">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.id}>
                        <button
                          className={`sidebar-subitem ${currentPage === subItem.id ? 'active' : ''}`}
                          onClick={() => handleNavigation(subItem.id)}
                        >
                          <span>{subItem.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          
          <div className="sidebar-footer">
            <button className="logout-button" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;