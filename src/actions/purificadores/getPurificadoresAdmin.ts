"use server";

import { executeQuery } from "@/lib/db";

export interface PurificadorAdminRow {
  // Campos de la tabla purificadores
  id: string;
  id_sala: number | null;
  n_sala: string | null;
  nombre_hospital: string | null;
  encendido: number | null;
  tipo_placa: number | null;
  velocidad_ventiladores: number | null;
  fecha_alta: Date | string | null;
  lampara_actual: number | null;
  fecha_actualizacion: Date | string | null;
  estado_actual: number | null;
  estado_maquina: number | null;
  // Campos de datos_purificadores
  dp_fecha_alta: Date | string | null;
  dp_fecha_fabricacion: Date | string | null;
  dp_version_software: string | null;

  [key: string]: any;
}

export async function getPurificadoresAdmin(limit: number = 100): Promise<PurificadorAdminRow[]> {
  const [rows]: any[] = await executeQuery(
    `
    SELECT
      p.*,
      s.n_sala,
      h.hospital AS nombre_hospital,
      dp.fecha_alta  AS dp_fecha_alta,
      dp.fecha_fabricacion AS dp_fecha_fabricacion,
      dp.version_software  AS dp_version_software
    FROM purificadores p
    LEFT JOIN salas s ON s.id = p.sala
    LEFT JOIN hospitales h ON h.id = s.hospital
    LEFT JOIN datos_purificadores dp ON dp.id = p.id
    ORDER BY p.id
    LIMIT ?
    `,
    [limit]
  );

  return rows as PurificadorAdminRow[];
}

