import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function EditMedications() {
const { medications } = useContext(AppContext);

return (
<div>
    <h2>Editar Productos</h2>
    <table border="1" cellPadding="5">
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Acción</th>
            </tr>
        </thead>
        <tbody>
            {medications.map(m => (
            <tr key={m.medicationID}>
                <td>{m.Name}</td>
                <td>{m.Amount}</td>
                <td>{m.Price}</td>
            <td><button>Editar</button></td>
            </tr>
            ))}
        </tbody>
    </table>
</div>
);
}