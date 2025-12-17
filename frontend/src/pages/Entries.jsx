import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Entries() {
const [entries, setEntries] = useState([]);

useEffect(() => {
fetch(`${API_URL}/movements`)
.then(res => res.json())
.then(data => setEntries(data.filter(m => m.Type === "entrada")));
}, []);

return (
<div>
    <h2>Entrada de Productos</h2>
    <ul>
        {entries.map(e => (
        <li key={e.movementID}>
        {e.medications?.Name} +{e.Amount} - {e.MovementDate}
        </li>
        ))}
    </ul>
</div>
);
}