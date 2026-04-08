import { Loader2 } from "lucide-react";
import { GroupedIncidencia } from "@/schemas/incidencias";

interface GroupedTableProps {
  rows: GroupedIncidencia[];
  loading: boolean;
  onRowClick: (purificadorId: string) => void;
}

export default function GroupedTable({ rows, loading, onRowClick }: GroupedTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm min-h-[300px]">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">ID Purificador</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Hospital</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Sala</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap text-center">Total</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap text-center">Pendientes</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap text-center">En Proceso</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap text-center">Resueltas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  Cargando resumen...
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center text-gray-400 italic">
                No hay incidencias registradas.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr 
                key={row.purificador_id} 
                onClick={() => onRowClick(row.purificador_id)}
                className="hover:bg-blue-50/50 transition-all cursor-pointer group"
                title="Click para ver historial detallado"
              >
                <td className="px-4 py-3 font-mono font-semibold text-blue-600 group-hover:underline">
                  {row.purificador_id}
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium">{row.hospital ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{row.sala ?? "—"}</td>
                <td className="px-4 py-3 font-extrabold text-gray-900 text-center bg-gray-50/30">{row.total_incidencias}</td>
                <td className="px-4 py-3 text-red-600 font-bold text-center">{row.total_pendientes}</td>
                <td className="px-4 py-3 text-amber-600 font-bold text-center">{row.total_en_proceso}</td>
                <td className="px-4 py-3 text-green-600 font-bold text-center">{row.total_resueltas}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
