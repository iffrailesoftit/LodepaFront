"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Power, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AsignarSalaModal from "@/components/admin/purificadores/modals/AsignarSalaModal";
import DatosPurificadorModal from "@/components/admin/purificadores/modals/DatosPurificadorModal";
import ConfiguracionHorariaModal from "@/components/admin/purificadores/modals/ConfiguracionHorariaModal";
import ReportarIncidenciaModal from "@/components/admin/purificadores/modals/ReportarIncidenciaModal";

import { formatLampTime } from "@/lib/timeFormatter";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface Purificador {
  id: string;
  nombre_hospital: string | null;
  n_sala: string | null;
  id_sala: number | null;
  encendido: number | null;
  fecha_actualizacion: string | null;
  lampara_actual: number | null;
  valor: any;
  medida: any;
  dp_fecha_alta: string | null;
  dp_fecha_fabricacion: string | null;
  dp_version_software: string | null;
}

export default function PurificadoresTableContent() {
  const [rows, setRows] = useState<Purificador[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [searchHospital, setSearchHospital] = useState("");
  const [searchId, setSearchId] = useState("");
  const [debouncedSearchHospital, setDebouncedSearchHospital] = useState("");
  const [debouncedSearchId, setDebouncedSearchId] = useState("");

  const fetchPurificadores = useCallback(async (page: number, hospital: string, id: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        hospital_nombre: hospital,
        purificador_id: id,
      });
      const res = await fetchWithAuth(`/api/purificador/listado?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar datos");
      const data = await res.json();
      setRows(data.rows);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al cargar el listado");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para filtros
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchHospital(searchHospital);
      setDebouncedSearchId(searchId);
      setCurrentPage(1); // Reset a primera página al filtrar
    }, 300);

    return () => clearTimeout(handler);
  }, [searchHospital, searchId]);

  // Carga de datos unificada (se dispara al cambiar página o filtros debounced)
  useEffect(() => {
    fetchPurificadores(currentPage, debouncedSearchHospital, debouncedSearchId);
  }, [currentPage, debouncedSearchHospital, debouncedSearchId, fetchPurificadores]);

  const handleToggleEncendido = async (id: string, currentStatus: number | null) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    setTogglingId(id);
    try {
      const res = await fetchWithAuth("/api/purificador/toggle-encendido", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, encendido: newStatus }),
      });

      if (!res.ok) throw new Error("Error al cambiar estado");
      
      setRows(prev => prev.map(row => row.id === id ? { ...row, encendido: newStatus } : row));
      toast.success(newStatus === 1 ? "Purificador encendido" : "Purificador apagado");
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("No se pudo cambiar el estado");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Hospital..."
            value={searchHospital}
            onChange={(e) => setSearchHospital(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID Placa..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm min-h-[400px]">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">ID Placa</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Hospital</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Sala</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tiempo Encendido</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Actualización</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Datos Técnicos</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 relative">
            {loading && rows.length === 0 ? (
               <tr>
                 <td colSpan={8} className="px-4 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                        Cargando purificadores...
                    </div>
                 </td>
               </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center text-gray-500 italic">
                  No se encontraron purificadores con esos filtros.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.id}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.nombre_hospital ?? <span className="text-gray-400 italic text-xs">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.n_sala ?? <span className="text-gray-400 italic text-xs">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {formatLampTime(row.lampara_actual)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {row.fecha_actualizacion
                      ? new Date(row.fecha_actualizacion).toLocaleString("es-ES")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleEncendido(row.id, row.encendido)}
                      disabled={togglingId === row.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        row.encendido === 1 ? "bg-green-500" : "bg-gray-300"
                      } ${togglingId === row.id ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          row.encendido === 1 ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                      {togglingId === row.id && (
                        <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-gray-600" />
                      )}
                    </button>
                    <div className="mt-1">
                        {row.encendido === 1 ? (
                            <span className="text-[10px] font-bold text-green-600 uppercase">On</span>
                        ) : (
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Off</span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DatosPurificadorModal
                      purificadorId={row.id}
                      fechaAlta={row.dp_fecha_alta}
                      fechaFabricacion={row.dp_fecha_fabricacion}
                      versionSoftware={row.dp_version_software}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <AsignarSalaModal
                        purificadorId={row.id}
                        salaAsignadaActual={row.id_sala}
                      />
                      <ConfiguracionHorariaModal purificadorId={row.id} />
                      <ReportarIncidenciaModal purificadorId={row.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>  
        </table>

        {loading && rows.length > 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 text-sm text-gray-600">
          <div>
            Mostrando registros <span className="font-semibold text-gray-900">{((currentPage - 1) * 15) + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * 15, totalCount)}</span> de <span className="font-semibold text-gray-900">{totalCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Mostrar solo páginas cercanas a la actual si hay muchas
                if (totalPages > 7) {
                    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 2) {
                        if (Math.abs(page - currentPage) === 3) return <span key={page}>...</span>;
                        return null;
                    }
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    className={`min-w-[32px] px-2 py-1 rounded-md border transition-all ${
                      currentPage === page
                        ? "bg-blue-600 border-blue-600 text-white font-semibold"
                        : "border-gray-200 hover:border-blue-400 text-gray-600"
                    } disabled:opacity-50`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
