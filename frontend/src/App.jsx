import { useState } from "react";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import Medications from "./pages/Medications/Medications";
import EditMedications from "./pages/EditMedications/EditMedications";
import Sales from "./pages/Sales/Sales";
import Entries from "./pages/Entries/Entries";
import ExpiredProducts from "./pages/ExpiredProducts/ExpiredProducts";
import "./App.css";

export default function App() {
  const [currentPage, setCurrentPage] = useState("medications");
  const [sidebarActive, setSidebarActive] = useState(false);

  // Función para alternar el sidebar
  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

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
          setPage={setCurrentPage}
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