import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ExpiredProducts() {
const [expired, setExpired] = useState([]);

useEffect(() => {
fetch(`${API_URL}/movements`)
.then(res => res.json())
.then(data => setExpired(data.filter(m => m.Type === "vencido")));
}, []);

return (
<div>
    <h2>Productos Caducados</h2>
    <ul>
        {expired.map(p => (
            <li key={p.movementID}>
            {p.medications?.Name} - expired on {p.ExpirationDate}
            </li>
        ))}
    </ul>
</div>
);
}