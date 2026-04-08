"use client";

import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useIncidencias } from "@/hooks/useIncidencias";
import DetailedTable from "./tables/DetailedTable";
import GroupedTable from "./tables/GroupedTable";
import { EstadoIncidencia } from "@/schemas/incidencias";
import { useState } from "react";
import HistorialPurificadorModal from "./modals/HistorialPurificadorModal";

const TABS: { estado: EstadoIncidencia; label: string; badge: string }[] = [
  { estado: "PENDIENTE",  label: "🔴 Pendientes",  badge: "bg-red-100 text-red-700" },
  { estado: "EN_PROCESO", label: "🟡 En Proceso",  badge: "bg-amber-100 text-amber-700" },
  { estado: "RESUELTO",   label: "🟢 Resueltas",   badge: "bg-green-100 text-green-700" },
];

export default function IncidenciasTableContent() {
  const {
    activeTab,
    setActiveTab,
    loading,
    loadingGrouped,
    isGroupedView,
    setIsGroupedView,
    rows,
    groupedRows,
    counts,
    atendiendo,
    handleAtender,
    refreshDetailed,
    refreshGrouped,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useIncidencias();

  const [selectedPurificadorId, setSelectedPurificadorId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Selector de Vista (Toggle) */}
      <div className="flex bg-gray-100 p-1 rounded-lg w-max mb-4">
        <button
          onClick={() => setIsGroupedView(false)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            !isGroupedView ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Vista Detallada
        </button>
        <button
          onClick={() => setIsGroupedView(true)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isGroupedView ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Agrupado por Máquina
        </button>
      </div>

      {!isGroupedView ? (
        <>
          {/* Pestañas */}
          <div className="flex flex-wrap items-center gap-1 border-b border-gray-200">
            {TABS.map(({ estado, label, badge }) => {
              const isActive = activeTab === estado;
              return (
                <button
                  key={estado}
                  onClick={() => setActiveTab(estado)}
                  className={`relative flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-all rounded-t-md focus:outline-none
                    ${isActive
                      ? "text-blue-600 border-b-2 border-blue-600 -mb-px bg-white"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {label}
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${badge}`}>
                    {counts[estado]}
                  </span>
                </button>
              );
            })}

            <button
              onClick={refreshDetailed}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>

          <DetailedTable 
            rows={rows} 
            loading={loading} 
            atendiendo={atendiendo} 
            onAtender={handleAtender} 
            onSuccess={refreshDetailed}
          />

          {/* Paginación */}
          <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg border border-gray-200 mt-4 shadow-sm">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Página <span className="font-semibold text-gray-900">{currentPage}</span> de{" "}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                    className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end border-b border-gray-200 pb-2">
            <button
              onClick={refreshGrouped}
              disabled={loadingGrouped}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingGrouped ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
            
          <GroupedTable 
            rows={groupedRows} 
            loading={loadingGrouped} 
            onRowClick={(id) => setSelectedPurificadorId(id)}
          />
        </div>
      )}

      {/* Modal de Historial */}
      {selectedPurificadorId && (
        <HistorialPurificadorModal 
          purificadorId={selectedPurificadorId} 
          onClose={() => setSelectedPurificadorId(null)} 
        />
      )}
    </div>
  );
}

