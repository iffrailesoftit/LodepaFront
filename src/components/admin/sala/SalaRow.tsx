import { SalasDispositivos } from "@/actions/hospital/sala/getSala";
import { Menu } from "lucide-react"
import { useState } from "react"
import CambiarEstadoDip from "./modal/CambiarEstadoDip";
import EditarSala from "./modal/EditarSala";
import BajaSalaModal from "./modal/BajaSalaModal";
import AltaSalaModal from "./modal/AltaSalaModal";
import { Hospital } from "@/actions/hospital/getHospital";

interface SalaRowProps {
    sala: SalasDispositivos;
    hospital: Hospital;
}

export default function SalaRow({ sala, hospital }: SalaRowProps) {
    const [isOpen, setIsOpen] = useState(false)

    const updateDate = new Date(sala.ultimaActualizacion)
    const now = new Date()
    const diffMinutes = (now.getTime() - updateDate.getTime()) / (1000 * 60)

    return (
        <tr key={sala.id_sala} className="hover:bg-gray-50">
            <td className="border px-4 py-2 text-sm">{sala.n_sala}</td>
            <td className="border px-4 py-2 text-sm">{sala.n_dispositivo}</td>
            <td className="border px-4 py-2 text-sm">{sala.referencia}</td>
            <td className="border px-4 py-2 text-sm">{sala.api_key_inbiot}</td>
            <td className={`border px-4 py-2 text-sm ${diffMinutes > 75 ? "text-red-500" : "text-gray-800"}`}>
                {updateDate.toLocaleString()}
            </td>
            <td className="border px-4 py-2 text-sm">
                {sala.fecha_baja ? sala.fecha_baja.toLocaleDateString('es-ES') : "Activo"}
            </td>
            <td className="border px-4 py-2 text-sm"><CambiarEstadoDip sala={sala} /></td>
            <td className="border px-4 py-2 text-sm">
                <div className="flex space-x-2">
                    <ul>
                        {!isOpen ? (
                            <li className="mb-2"><Menu onClick={() => setIsOpen(!isOpen)} /></li>
                        ) : (
                            <><li className="mb-2"><EditarSala sala={sala} hospital={hospital} /></li>
                                <li className="mb-2">
                                    {!sala.fecha_baja ? (
                                        <BajaSalaModal sala={sala} hospital={hospital} />
                                    ) : (
                                        <AltaSalaModal sala={sala} hospital={hospital} />
                                    )}
                                </li>
                            </>
                        )}

                    </ul>
                </div>
            </td>
        </tr>
    )
}

