"use server";
import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface Registro extends RowDataPacket {
  id: number;
  hospital: string;
  n_sala: string;
  n_dispositivo: string;
  fecha: Date;
  co2: number;
  humidity: number;
  pm10: number;
  pm25: number;
  temperature: number;
  vocs: number;
  co: number;
  formaldehyde: number;
  no2: number;
  o3: number;
  pm1: number;
  pm4: number;
}

export async function getRegistro(
  dispositivo: number,
  fechaInicio: string,
  fechaFin: string
): Promise<Registro[]> {
  try {
    const [rows] = await executeQuery<Registro[] & RowDataPacket[]>(
    `SELECT d.id,
            h.hospital,
            s.n_sala,
            d.n_dispositivo,
            DATE_FORMAT(r.update_time, '%Y-%m-%d %H:%i')   as fecha,
            MAX(r.temperature) AS temperature,
            MAX(r.humidity) AS humidity,
            MAX(r.co2) AS co2,
            MAX(r.pm10) AS pm10,
            MAX(r.pm25) AS pm25,
            MAX(r.vocs/1000) AS vocs,
            MAX(r.co) AS co,
            MAX(r.formaldehyde/1000) AS formaldehyde,
            MAX(r.no2) AS no2,
            MAX(r.o3) AS o3,
            MAX(r.pm1) AS pm1,
            MAX(r.pm4) AS pm4
    FROM registros r
    INNER JOIN dispositivos d ON d.id=r.dispositivo
    INNER JOIN salas s ON s.id=d.sala
    INNER JOIN hospitales h ON h.id=s.hospital
    WHERE d.id=? AND r.update_time BETWEEN ? AND ?
    GROUP BY d.id,h.hospital,s.n_sala,d.n_dispositivo,DATE_FORMAT(r.update_time, '%Y-%m-%d %H:%i')
    ORDER BY h.hospital,s.n_sala,d.n_dispositivo,DATE_FORMAT(r.update_time, '%Y-%m-%d %H:%i') ;`,
      [dispositivo, fechaInicio, fechaFin]
    );

    return rows;
  } catch (error) {
    console.error("Error al obtener registros:", error);
    throw new Error("No se pudieron obtener los registros");
  }
}

export interface RegistroDiario extends RowDataPacket {
  /** Fecha de la lectura (YYYY-MM-DD) */
  fecha: string;

  /** Temperatura (°C) */
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;

  /** Humedad (%) */
  avgHumidity: number;
  maxHumidity: number;
  minHumidity: number;

  /** CO₂ (ppm) */
  avgCo2: number;
  maxCo2: number;
  minCo2: number;

  /** PM10 (µg/m³) */
  avgPm10: number;
  maxPm10: number;
  minPm10: number;

  /** PM2.5 (µg/m³) */
  avgPm25: number;
  maxPm25: number;
  minPm25: number;

  /** COVs (mg/m³) — original en µg/m³ dividido entre 1 000 */
  avgVocs: number;
  maxVocs: number;
  minVocs: number;

  /** CO (ppm) */
  avgCo: number;
  maxCo: number;
  minCo: number;

  /** Formaldehído (mg/m³) — original en µg/m³ dividido entre 1 000 */
  avgFormaldehyde: number;
  maxFormaldehyde: number;
  minFormaldehyde: number;

  /** NO₂ (ppb) */
  avgNo2: number;
  maxNo2: number;
  minNo2: number;

  /** O₃ (ppb) */
  avgO3: number;
  maxO3: number;
  minO3: number;

  /** PM1 (µg/m³) */
  avgPm1: number;
  maxPm1: number;
  minPm1: number;

  /** PM4 (µg/m³) */
  avgPm4: number;
  maxPm4: number;
  minPm4: number;
}

/**
 * Obtiene estadísticas diarias de sensores para un dispositivo en un rango de fechas.
 * @param dispositivo ID del dispositivo
 * @param fechaInicio Fecha inicio (YYYY-MM-DD)
 * @param fechaFin Fecha fin (YYYY-MM-DD)
 * @returns Lista de registros diarios
 */
export async function getRegistroDiario(
  dispositivo: number,
  fechaInicio: string,
  fechaFin: string
): Promise<RegistroDiario[]> {
  const sql = `
    SELECT
      DATE(r.update_time) AS fecha,
      AVG(r.temperature)    AS avgTemperature,
      MAX(r.temperature)    AS maxTemperature,
      MIN(r.temperature)    AS minTemperature,

      AVG(r.humidity)       AS avgHumidity,
      MAX(r.humidity)       AS maxHumidity,
      MIN(r.humidity)       AS minHumidity,

      AVG(r.CO2)            AS avgCo2,
      MAX(r.CO2)            AS maxCo2,
      MIN(r.CO2)            AS minCo2,

      AVG(r.PM10)           AS avgPm10,
      MAX(r.PM10)           AS maxPm10,
      MIN(r.PM10)           AS minPm10,

      AVG(r.PM25)           AS avgPm25,
      MAX(r.PM25)           AS maxPm25,
      MIN(r.PM25)           AS minPm25,

      AVG(r.vocs / 1000)    AS avgVocs,
      MAX(r.vocs / 1000)    AS maxVocs,
      MIN(r.vocs / 1000)    AS minVocs,

      AVG(r.co)             AS avgCo,
      MAX(r.co)             AS maxCo,
      MIN(r.co)             AS minCo,

      AVG(r.formaldehyde / 1000) AS avgFormaldehyde,
      MAX(r.formaldehyde / 1000) AS maxFormaldehyde,
      MIN(r.formaldehyde / 1000) AS minFormaldehyde,

      AVG(r.no2)            AS avgNo2,
      MAX(r.no2)            AS maxNo2,
      MIN(r.no2)            AS minNo2,

      AVG(r.o3)             AS avgO3,
      MAX(r.o3)             AS maxO3,
      MIN(r.o3)             AS minO3,

      AVG(r.pm1)            AS avgPm1,
      MAX(r.pm1)            AS maxPm1,
      MIN(r.pm1)            AS minPm1,

      AVG(r.pm4)            AS avgPm4,
      MAX(r.pm4)            AS maxPm4,
      MIN(r.pm4)            AS minPm4
    FROM registros r
    INNER JOIN dispositivos d ON d.id = r.dispositivo
    INNER JOIN salas s        ON s.id = d.sala
    INNER JOIN hospitales h    ON h.id = s.hospital
    WHERE d.id = ?
      AND r.update_time BETWEEN ? AND ?
    GROUP BY DATE(r.update_time)
    ORDER BY DATE(r.update_time);
  `;

  try {
    const [rows] = await executeQuery<RegistroDiario[]>(sql, [dispositivo, fechaInicio, fechaFin]);
    return rows;
  } catch (error) {
    console.error('Error al obtener registros diarios:', error);
    throw new Error('No se pudieron obtener los registros diarios');
  }
}

