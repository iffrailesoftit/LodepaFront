"use client";

import { updateEstadoDip } from "@/actions/dispositivo/formDispositivo";
import { SalasDispositivos } from "@/actions/hospital/sala/getSala";
import { Power, PowerOff } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CambiarEstadoDipProps {
  sala: SalasDispositivos;
}

export default function CambiarEstadoDip({ sala }: CambiarEstadoDipProps) {
  const id = sala.id_dispositivo;

  // Normalizamos el valor inicial a "S" / "N"
  const initialEstado = (sala.encendido ?? "")
    .toString()
    .trim()
    .toUpperCase();

  const [encendido, setEncendido] = useState<string>(initialEstado);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Si sala.encendido cambia desde el servidor (router.refresh),
  // sincronizamos el estado local:
  useEffect(() => {
    const normalizado = (sala.encendido ?? "")
      .toString()
      .trim()
      .toUpperCase();
    setEncendido(normalizado);
  }, [sala.encendido]);

  // isActive SIEMPRE depende de encendido
  const isActive = encendido === "S";

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevo = e.target.value;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("encendido", nuevo);

    try {
      const result = await updateEstadoDip(formData);
      if (result.ok === 1) {
        toast(result.mensaje, {
          icon: <Power color="#35ec32" />,
          style: { color: "#35ec32" },
        });
      } else {
        toast(result.mensaje, {
          icon: <PowerOff color="#ff0000" />,
          style: { color: "#ff0000" },
        });
      }

      // Aquí actualizas el estado local → cambia isActive → cambia la clase
      setEncendido(nuevo);
    } catch (error) {
      console.error("Error al actualizar estado DIP:", error);
      toast.error("No se pudo actualizar el estado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <select
        value={encendido}
        onChange={handleChange}
        disabled={isLoading}
        className={`
          appearance-none cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-all duration-200
          ${
            (encendido === "S")
              ? "bg-green-100 text-green-800 border-2 border-green-200 hover:bg-green-200 pr-7"
              : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200 pr-7"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        `}
      >
        <option value="S">ON</option>
        <option value="N">OFF</option>
      </select>

      {/* Icono personalizado */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        {isLoading ? (
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isActive ? (
          <Power className="h-4 w-4 text-green-600" />
        ) : (
          <PowerOff className="h-4 w-4 text-gray-500" />
        )}
      </div>
    </div>
  );
}
