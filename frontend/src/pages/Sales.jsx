import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Sales() {
const [sales, setSales] = useState([]);

useEffect(() => {
fetch(`${API_URL}/movements`)
.then(res => res.json())
.then(data => setSales(data.filter(m => m.Type === "salida")));
}, []);

return (
<div>
    <h2>Historial de Ventas</h2>
    <ul>
        {sales.map(s => (
        <li key={s.movementID}>
        {s.medications?.Name} - {s.Amount} units - {s.MovementDate}
        </li>
        ))}
    </ul>
</div>
);
}