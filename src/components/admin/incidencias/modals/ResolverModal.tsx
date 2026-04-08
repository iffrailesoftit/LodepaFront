"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface ResolverModalProps {
  ticketId: number;
  onSuccess: () => void;
}

export default function ResolverModal({ ticketId, onSuccess }: ResolverModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setComentario("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comentario.trim()) return;

    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/incidencias/resolver", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, comentario_resolucion: comentario }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error al resolver");
      }

      toast.success("✅ Ticket resuelto correctamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error(error.message ?? "No se pudo resolver el ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 rounded text-xs font-medium transition-colors whitespace-nowrap"
      >
        Resolver
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Resolver Ticket #{ticketId}</h2>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentario de resolución <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Describe cómo se resolvió la incidencia..."
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
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
                  disabled={!comentario.trim() || loading}
                  className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium min-w-[110px] justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar"
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
