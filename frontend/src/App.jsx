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
      {/* Botón para móviles */}
      <button 
        className="sidebar-toggle" 
        onClick={() => setSidebarActive(!sidebarActive)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      
      {/* Sidebar */}
      <Sidebar 
        setPage={setCurrentPage} 
        active={sidebarActive}
        setActive={setSidebarActive}
        currentPage={currentPage}
      />
      
      {/* Overlay para móviles */}
      {sidebarActive && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarActive(false)}
        />
      )}
      
      {/* Contenido principal */}
      <div className="main-content">
        <Header />
        <div className="page-container">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}