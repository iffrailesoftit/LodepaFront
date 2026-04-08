"use client";

import { useState } from "react";
import { X, Eye } from "lucide-react";

interface Incidencia {
  id: number;
  purificador_id: string;
  tipo_incidencia: string;
  descripcion: string;
  estado: string;
  fecha_reporte: string;
  fecha_resolucion: string | null;
  comentario_resolucion: string | null;
  nombre_reporta: string | null;
  nombre_tecnico: string | null;
  nombre_hospital: string | null;
  nombre_sala: string | null;
}

interface DetallesModalProps {
  incidencia: Incidencia;
}

const TIPO_LABELS: Record<string, string> = {
  AVERIA: "Avería",
  MANTENIMIENTO: "Mantenimiento",
  CAMBIO_FILTRO: "Cambio de Filtro",
  OTRO: "Otro",
};

function Campo({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800 font-medium">
        {value ?? <span className="text-gray-400 italic font-normal">—</span>}
      </p>
    </div>
  );
}

export default function DetallesModal({ incidencia }: DetallesModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1"
      >
        <Eye className="h-3.5 w-3.5" />
        Ver Detalles
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Detalles del Ticket #{incidencia.id}</h2>
                <span className="inline-block mt-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                  🟢 RESUELTO
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Equipo */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
                <Campo label="Purificador" value={incidencia.purificador_id} />
                <Campo label="Tipo" value={TIPO_LABELS[incidencia.tipo_incidencia] ?? incidencia.tipo_incidencia} />
                <Campo label="Hospital" value={incidencia.nombre_hospital} />
                <Campo label="Sala" value={incidencia.nombre_sala} />
              </div>

              {/* Reporte */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📋 Reporte inicial</p>
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Reportado por" value={incidencia.nombre_reporta} />
                  <Campo label="Fecha de Reporte" value={fmt(incidencia.fecha_reporte)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descripción</p>
                  <p className="mt-0.5 text-sm text-gray-800 bg-gray-50 rounded p-2 whitespace-pre-wrap">
                    {incidencia.descripcion ?? <span className="text-gray-400 italic">Sin descripción</span>}
                  </p>
                </div>
              </div>

              {/* Resolución */}
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">✅ Resolución</p>
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Técnico" value={incidencia.nombre_tecnico} />
                  <Campo label="Fecha de Resolución" value={fmt(incidencia.fecha_resolucion)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Comentario</p>
                  <p className="mt-0.5 text-sm text-gray-800 bg-white rounded p-2 border border-green-200 whitespace-pre-wrap">
                    {incidencia.comentario_resolucion ?? <span className="text-gray-400 italic">Sin comentario</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 font-medium"
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
