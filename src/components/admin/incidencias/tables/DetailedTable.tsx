import { Loader2 } from "lucide-react";
import { Incidencia, TIPO_LABELS } from "@/schemas/incidencias";
import ResolverModal from "@/components/admin/incidencias/modals/ResolverModal";
import DetallesModal from "@/components/admin/incidencias/modals/DetallesModal";

interface DetailedTableProps {
  rows: Incidencia[];
  loading: boolean;
  atendiendo: number | null;
  onAtender: (id: number) => void;
  onSuccess: () => void;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function DetailedTable({ rows, loading, atendiendo, onAtender, onSuccess }: DetailedTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm min-h-[300px]">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">ID Ticket</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Purificador</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Hospital / Sala</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tipo</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Fecha Reporte</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Reportado por</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Técnico</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={8} className="px-4 py-16 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  Cargando incidencias...
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-16 text-center text-gray-400 italic">
                No hay incidencias en este estado.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-gray-900">#{row.id}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">{row.purificador_id}</td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="font-medium text-gray-800">{row.nombre_hospital ?? "—"}</span>
                  {row.nombre_sala && (
                    <span className="text-xs text-gray-500"> / {row.nombre_sala}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TipoBadge tipo={row.tipo_incidencia} />
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{fmt(row.fecha_reporte)}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">
                  {row.nombre_reporta ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs">
                  {row.nombre_tecnico ?? <span className="text-gray-400 italic">Sin asignar</span>}
                </td>
                <td className="px-4 py-3">
                  <AccionesCell
                    incidencia={row}
                    onAtender={() => onAtender(row.id)}
                    isAtendiendo={atendiendo === row.id}
                    onSuccess={onSuccess}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const COLORS: Record<string, string> = {
    AVERIA:        "bg-red-100 text-red-700",
    MANTENIMIENTO: "bg-blue-100 text-blue-700",
    CAMBIO_FILTRO: "bg-purple-100 text-purple-700",
    OTRO:          "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLORS[tipo] ?? "bg-gray-100 text-gray-700"}`}>
      {TIPO_LABELS[tipo as keyof typeof TIPO_LABELS] ?? tipo}
    </span>
  );
}

function AccionesCell({
  incidencia,
  onAtender,
  isAtendiendo,
  onSuccess,
}: {
  incidencia: Incidencia;
  onAtender: () => void;
  isAtendiendo: boolean;
  onSuccess: () => void;
}) {
  if (incidencia.estado === "PENDIENTE") {
    return (
      <button
        onClick={onAtender}
        disabled={isAtendiendo}
        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait"
      >
        {isAtendiendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Atender
      </button>
    );
  }

  if (incidencia.estado === "EN_PROCESO") {
    return <ResolverModal ticketId={incidencia.id} onSuccess={onSuccess} />;
  }

  if (incidencia.estado === "RESUELTO") {
    return <DetallesModal incidencia={incidencia} />;
  }

  return null;
}
