import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const Header = ({ toggleSidebar, sidebarActive }) => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          aria-expanded={sidebarActive}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        
        <div className="header-title">
          <h1>Farmacia Sory</h1>
          <p className="header-subtitle">Sistema de Gestión Farmacéutica</p>
        </div>
      </div>
    </header>
  );
};

export default Header;