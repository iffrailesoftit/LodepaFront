import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface ListadoSalas extends RowDataPacket {
  id_sala: number;
  n_sala: string;
  id_dispositivo: number;
  n_dispositivo: string;
  updateTime: Date;
  co2: number;
  covid19: number;
  humidity: number;
  iaq: number;
  pm10: number;
  pm25: number;
  temperature: number;
  vocs: number;
  thermalIndicator: number;
  ventilationIndicator: number;
  co: number;
  formaldehyde: number;
  no2: number;
  o3: number;
  pm1: number;
  pm4: number;
}

export async function getListadoSalas(
  id_hospital: number,
  id: number,
  rol: number
): Promise<ListadoSalas[]> {
  try {
    let rows;
    // CONTROL DE PERSMISOS
    if (rol === 3) {
      [rows] = await executeQuery<ListadoSalas[] & RowDataPacket[]>(
        `SELECT s.id AS id_sala,
       s.n_sala,
       r.dispositivo AS id_dispositivo,
       d.n_dispositivo,
       r.co2,
       r.covid19,
       r.humidity,
       r.iaq,
       r.pm10,
       r.pm25,
       r.temperature,
       ROUND((r.vocs /1000), 3) AS vocs, 
       r.thermal_indicator AS thermalIndicator,
       r.ventilation_indicator AS ventilationIndicator,
       ROUND((r.co / 1000), 3) AS co,
       ROUND((r.formaldehyde / 1000) * 0.85, 3) AS formaldehyde,
       ROUND((r.no2 / 1000), 3) AS no2,
       ROUND((r.o3 / 1000), 3) AS o3,
       r.pm1,
       r.pm4,
       r.update_time AS updateTime
FROM salas s
JOIN usuarios_salas us ON s.id = us.sala_id
LEFT JOIN dispositivos d ON s.id = d.sala
LEFT JOIN registros r ON d.id = r.dispositivo
  AND r.update_time = (
    SELECT MAX(r2.update_time)
    FROM registros r2
    WHERE r2.dispositivo = d.id
  )
WHERE us.usuario_id = ?
  AND s.hospital = ?;`,
        [id, id_hospital]
      );
    } else {
      [rows] = await executeQuery<ListadoSalas[] & RowDataPacket[]>(
        `SELECT s.id AS id_sala,
                s.n_sala,
                r.dispositivo AS id_dispositivo,
                d.n_dispositivo,
                r.co2,
                r.covid19,
                r.humidity,
                r.iaq,
                r.pm10,
                r.pm25,
                r.temperature,
                ROUND((r.vocs/1000), 3) AS vocs,
                r.thermal_indicator AS thermalIndicator,
                r.ventilation_indicator AS ventilationIndicator,
                ROUND((r.co / 1000), 3) AS co,
                ROUND((r.formaldehyde / 1000) * 0.85, 3) AS formaldehyde,
                ROUND((r.no2 / 1000), 3) AS no2,
                ROUND((r.o3 / 1000), 3) AS o3,
                r.pm1,
                r.pm4,
                r.update_time AS updateTime
         FROM salas s
         LEFT JOIN dispositivos d ON s.id = d.sala
         LEFT JOIN registros r ON d.id = r.dispositivo
           AND r.update_time = (
             SELECT MAX(r2.update_time)
             FROM registros r2
             WHERE r2.dispositivo = d.id
           )
         WHERE s.hospital = ?;`,
        [id_hospital]
      );
    }

    return rows;
  } catch (error) {
    console.error("Error al obtener listado de salas:", error);
    throw new Error("No se pudieron obtener las salas");
  }
}
