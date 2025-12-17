import Header from "./components/header/header";
import Sidebar from "./components/sidebar/sidebar";
import { AppProvider } from "./context/AppContext";
import Medications from "./pages/Medications";
import EditMedications from "./pages/EditMedications";
import Sales from "./pages/Sales";
import Entries from "./pages/Entries";
import ExpiredProducts from "./pages/ExpiredProducts";

import { useState } from "react";
import "./App.css";

function App() {
  // 👇 PÁGINA INICIAL
  const [page, setPage] = useState("medications");

  const renderPage = () => {
    switch (page) {
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
    <AppProvider>
      <Header />
      <div className="layout">
        <Sidebar setPage={setPage} />
        <main className="content">{renderPage()}</main>
      </div>
    </AppProvider>
  );
}

export default App;
