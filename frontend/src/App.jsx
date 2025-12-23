import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import LoginPage from "./pages/LoginPage/LoginPage";
import Medications from "./pages/Medications/Medications";
import EditMedications from "./pages/EditMedications/EditMedications";
import Sales from "./pages/Sales/Sales";
import Entries from "./pages/Entries/Entries";
import ExpiredProducts from "./pages/ExpiredProducts/ExpiredProducts";
import "./App.css";

export default function App() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState("medications");
  const [sidebarActive, setSidebarActive] = useState(false);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setCurrentPage("login");
    } else if (!loading && isAuthenticated && currentPage === "login") {
      setCurrentPage("medications");
    }
  }, [isAuthenticated, loading, currentPage]);

  // Función para alternar el sidebar
  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  // Función para navegar entre páginas (usada por Sidebar)
  const navigateToPage = (page) => {
    setCurrentPage(page);
    if (window.innerWidth <= 768) {
      setSidebarActive(false);
    }
  };

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando sistema...</p>
      </div>
    );
  }

  // Si no está autenticado, mostrar solo LoginPage
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <LoginPage />
      </div>
    );
  }

  // Renderizar página actual si está autenticado
  const renderPage = () => {
    switch (currentPage) {
      case "medications":
        return <Medications />;
      case "edit-medications":
        return <EditMedications />;
      case "sales":
        return <Sales />;
      case "entries":
        return <Entries />;
      case "expired":
        return <ExpiredProducts />;
      default:
        return <Medications />;
    }
  };

  return (
    <div className="app-container">
      {/* Header con botón de hamburguesa */}
      <Header 
        toggleSidebar={toggleSidebar} 
        sidebarActive={sidebarActive}
      />
      
      {/* Overlay para cerrar sidebar en móviles */}
      {sidebarActive && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarActive(false)}
        ></div>
      )}
      
      <div className="main-content">
        {/* Sidebar */}
        <Sidebar 
          setPage={navigateToPage}
          active={sidebarActive}
          setActive={setSidebarActive}
          currentPage={currentPage}
        />
        
        {/* Contenido principal */}
        <main className="content-area">
          {/* Renderizar la página actual */}
          {renderPage()}
        </main>
      </div>
    </div>
  );
}