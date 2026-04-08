import { z } from "zod";

export const EstadoIncidenciaEnum = z.enum(["PENDIENTE", "EN_PROCESO", "RESUELTO"]);
export type EstadoIncidencia = z.infer<typeof EstadoIncidenciaEnum>;

export const TipoIncidenciaEnum = z.enum([
  "AVERIA",
  "MANTENIMIENTO",
  "CAMBIO_FILTRO",
  "OTRO",
]);
export type TipoIncidencia = z.infer<typeof TipoIncidenciaEnum>;

export const TIPO_LABELS: Record<TipoIncidencia, string> = {
  AVERIA: "Avería",
  MANTENIMIENTO: "Mantenimiento",
  CAMBIO_FILTRO: "Cambio de Filtro",
  OTRO: "Otro",
};

// Esquema para la creación de una incidencia
export const createIncidenciaSchema = z.object({
  purificador_id: z.string().min(1, "El ID del purificador es obligatorio"),
  tipo_incidencia: TipoIncidenciaEnum,
  descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
});

// Interfaces para el frontend
export interface Incidencia {
  id: number;
  purificador_id: string;
  tipo_incidencia: TipoIncidencia;
  descripcion: string;
  estado: EstadoIncidencia;
  fecha_reporte: string;
  fecha_resolucion: string | null;
  comentario_resolucion: string | null;
  usuario_reporta_id: number;
  tecnico_id: number | null;
  nombre_reporta: string | null;
  nombre_tecnico: string | null;
  nombre_hospital: string | null;
  nombre_sala: string | null;
}

export interface GroupedIncidencia {
  purificador_id: string;
  hospital: string | null;
  sala: string | null;
  total_incidencias: number;
  total_pendientes: number;
  total_en_proceso: number;
  total_resueltas: number;
}
