import { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import "./Medications.css";

export default function Medications() {
const { medications } = useContext(AppContext);
const [search, setSearch] = useState("");

const filtered = medications.filter(m =>
m.Name.toLowerCase().includes(search.toLowerCase())
);

return (
<div>
    <h2>Todos los Productos</h2>
    <input
    placeholder="Search medication"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    />

    <table border="1" cellPadding="5">
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Fecha de Expiracióm</th>
            </tr>
        </thead>
        <tbody>
        {filtered.map(m => (
        <tr key={m.medicationID}>
            <td>{m.Name}</td>
            <td>{m.Amount}</td>
            <td>{m.Price}</td>
            <td>{m.ExpirationDate}</td>
        </tr>
        ))}
        </tbody>
    </table>
</div>
);
}