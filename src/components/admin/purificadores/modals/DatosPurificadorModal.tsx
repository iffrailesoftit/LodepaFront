"use client";

import { Info } from "lucide-react";
import { useState, useEffect } from "react";

interface DatosPurificadorModalProps {
  purificadorId: string;
  fechaAlta: string | Date | null;
  fechaFabricacion: string | Date | null;
  versionSoftware: string | null;
}

export default function DatosPurificadorModal({
  purificadorId,
  fechaAlta,
  fechaFabricacion,
  versionSoftware,
}: DatosPurificadorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const formatearFecha = (fechaOriginal: string | Date | null) => {
    if (!fechaOriginal) return "No disponible";
    try {
      const fecha = new Date(fechaOriginal);
      if (isNaN(fecha.getTime())) return "Fecha inválida";
      
      const dia = fecha.getDate().toString().padStart(2, "0");
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const anio = fecha.getFullYear();
      
      return `${dia}/${mes}/${anio}`;
    } catch {
      return "No disponible";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-slate-700 hover:bg-slate-800 text-white py-1 px-3 rounded flex items-center justify-center transition-colors text-xs font-medium whitespace-nowrap"
      >
        <Info className="h-4 w-4 mr-1" />
        Ver Datos
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
          <div
            className={`bg-white p-6 rounded-lg shadow-lg ${
              isMobile ? "w-full max-w-md mx-4" : "w-113"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Datos Técnicos del Purificador
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100 space-y-3 mb-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-sm font-medium text-gray-500">ID del Equipo:</span>
                <span className="text-sm font-semibold text-gray-800">{purificadorId}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-sm font-medium text-gray-500">Versión de Software:</span>
                <span className="text-sm font-semibold text-gray-800 bg-gray-200 px-2 py-0.5 rounded">
                  {versionSoftware || "No especificada"} 
                </span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-sm font-medium text-gray-500">Fecha de Alta:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatearFecha(fechaAlta)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Fecha de Fabricación:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatearFecha(fechaFabricacion)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
