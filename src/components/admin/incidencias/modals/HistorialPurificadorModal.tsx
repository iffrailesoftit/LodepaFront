"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar, User, ClipboardList, Info } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import toast from "react-hot-toast";

interface IncidenciaHistorial {
  id: number;
  fecha_reporte: string;
  tipo_incidencia: string;
  descripcion: string;
  estado: string;
  fecha_resolucion: string | null;
  nombre_reporta: string | null;
  nombre_tecnico: string | null;
}

interface HistorialPurificadorModalProps {
  purificadorId: string;
  onClose: () => void;
}

const TIPO_LABELS: Record<string, string> = {
  AVERIA: "Avería",
  MANTENIMIENTO: "Mantenimiento",
  CAMBIO_FILTRO: "Cambio de Filtro",
  OTRO: "Otro",
};

const ESTADO_BADGES: Record<string, string> = {
  PENDIENTE: "bg-red-100 text-red-700 border-red-200",
  EN_PROCESO: "bg-amber-100 text-amber-700 border-amber-200",
  RESUELTO: "bg-green-100 text-green-700 border-green-200",
};

export default function HistorialPurificadorModal({ 
  purificadorId, 
  onClose 
}: HistorialPurificadorModalProps) {
  const [history, setHistory] = useState<IncidenciaHistorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/incidencias/purificador/${purificadorId}`);
        if (!res.ok) throw new Error("Error al cargar el historial");
        const data = await res.json();
        setHistory(data);
      } catch (error: any) {
        if (error.message === "Sesión expirada") return;
        toast.error("No se pudo cargar el historial del purificador");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [purificadorId, onClose]);

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Historial de Incidencias</h2>
              <p className="text-sm text-gray-500 font-mono">Purificador: {purificadorId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="text-gray-500 font-medium font-sans">Obteniendo historial detallado...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No se encontraron incidencias para este equipo.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Descripción</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Participantes</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {fmt(item.fecha_reporte)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">
                          {TIPO_LABELS[item.tipo_incidencia] ?? item.tipo_incidencia}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-md">
                        <p className="text-gray-600 line-clamp-2" title={item.descripcion}>
                          {item.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1 text-gray-500">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-gray-700 truncate max-w-[120px]">
                              {item.nombre_reporta}
                            </span>
                          </div>
                          {item.nombre_tecnico && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <span className="font-bold">🛠️</span>
                              <span className="font-semibold truncate max-w-[120px]">
                                {item.nombre_tecnico}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${ESTADO_BADGES[item.estado]}`}>
                          {item.estado.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
}
