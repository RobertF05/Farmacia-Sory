import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

export const AppProvider = ({ children }) => {
const [medications, setMedications] = useState([]);

const loadMedications = async () => {
const res = await fetch(`${API_URL}/medications`);
const data = await res.json();
setMedications(data);
};

useEffect(() => {
loadMedications();
}, []);

return (
<AppContext.Provider value={{ medications, loadMedications }}>
{children}
</AppContext.Provider>
);
};