import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Incidencia, GroupedIncidencia, EstadoIncidencia } from "@/schemas/incidencias";

export function useIncidencias() {
  const [activeTab, setActiveTab] = useState<EstadoIncidencia>("PENDIENTE");
  const [rows, setRows] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [atendiendo, setAtendiendo] = useState<number | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [counts, setCounts] = useState<Record<EstadoIncidencia, number>>({
    PENDIENTE: 0,
    EN_PROCESO: 0,
    RESUELTO: 0,
  });

  const [isGroupedView, setIsGroupedView] = useState(false);
  const [groupedRows, setGroupedRows] = useState<GroupedIncidencia[]>([]);
  const [loadingGrouped, setLoadingGrouped] = useState(false);

  const fetchGroupedData = useCallback(async () => {
    setLoadingGrouped(true);
    try {
      const res = await fetchWithAuth("/api/incidencias/agrupadas");
      if (!res.ok) throw new Error("Error al cargar datos agrupados");
      const data = await res.json();
      setGroupedRows(data);
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al cargar el listado agrupado");
    } finally {
      setLoadingGrouped(false);
    }
  }, []);

  const fetchIncidencias = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/incidencias?page=${page}&limit=10&estado=${activeTab}`);
      if (!res.ok) throw new Error("Error al cargar datos");
      
      const result = await res.json();
      
      setRows(result.data);
      setTotalPages(result.total_pages);
      setTotalRecords(result.total_records);
      setCounts(result.counts);
      setCurrentPage(page);
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al cargar el listado de incidencias");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isGroupedView) {
      fetchGroupedData();
    } else {
      fetchIncidencias(currentPage);
    }
  }, [isGroupedView, fetchIncidencias, fetchGroupedData, currentPage]);

  // Resetear página al cambiar de tab
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleAtender = async (id: number) => {
    setAtendiendo(id);
    try {
      const res = await fetchWithAuth("/api/incidencias/atender", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error al atender");
      }

      toast.success("✅ Ticket asignado – pasó a En Proceso");
      fetchIncidencias(currentPage);
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error(error.message ?? "No se pudo atender el ticket");
    } finally {
      setAtendiendo(null);
    }
  };

  return {
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
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    refreshDetailed: () => fetchIncidencias(currentPage),
    refreshGrouped: fetchGroupedData,
  };
}
