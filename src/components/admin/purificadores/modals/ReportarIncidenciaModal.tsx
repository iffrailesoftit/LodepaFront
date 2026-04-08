"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface ReportarIncidenciaModalProps {
  purificadorId: string;
}

const TIPOS = [
  { value: "AVERIA", label: "Avería" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "CAMBIO_FILTRO", label: "Cambio de Filtro" },
  { value: "OTRO", label: "Otro" },
];

export default function ReportarIncidenciaModal({ purificadorId }: ReportarIncidenciaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tipo, setTipo] = useState("AVERIA");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setTipo("AVERIA");
    setDescripcion("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/incidencias/reportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purificador_id: purificadorId,
          tipo_incidencia: tipo,
          descripcion,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error al reportar");
      }

      toast.success("✅ Incidencia reportada correctamente");
      handleClose();
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error(error.message ?? "No se pudo reportar la incidencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded flex items-center justify-center transition-colors text-xs font-medium whitespace-nowrap"
        title="Reportar Incidencia"
      >
        <AlertTriangle className="h-4 w-4 mr-1" />
        Reportar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Reportar Incidencia</h2>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ID Purificador – solo lectura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purificador
                </label>
                <input
                  type="text"
                  value={purificadorId}
                  readOnly
                  className="w-full border border-gray-200 rounded-md p-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Tipo de Incidencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Incidencia
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  disabled={loading}
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe la incidencia con detalle..."
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!descripcion.trim() || loading}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium min-w-[130px] justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enviar Reporte"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
