"use server";

import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface Sala extends RowDataPacket {
  id: number;
  n_sala: string;
}

export interface Salas extends RowDataPacket {
  id: number;
  n_sala: string;
  hospital: number;
}

export interface SalasDispositivos extends RowDataPacket {
  id_sala: number;
  n_sala: string;
  id_dispositivo: number;
  n_dispositivo: string;
  referencia: string;
  api_key_inbiot: string;
  ultimaActualizacion: Date;
  encendido: string;
}

export async function getSalaByHospital(id:number): Promise<Sala[]> {
  try {
    const [rows] = await executeQuery<Sala[] & RowDataPacket[]>(
      `SELECT s.id, s.n_sala FROM salas AS s WHERE s.hospital = ?;`, [id]
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}

export async function getSalaYDispositivoByHospital(id:number): Promise<SalasDispositivos[]> {
  try {
    const [rows] = await executeQuery<SalasDispositivos[] & RowDataPacket[]>(
      `SELECT 
          s.id AS id_sala,
          s.n_sala,
          d.id AS id_dispositivo,
          d.n_dispositivo,
          d.referencia,
          d.api_key_inbiot,
          MAX(r.update_time) AS ultimaActualizacion,
          d.encendido
        FROM salas s
        LEFT JOIN dispositivos d ON s.id = d.sala
        LEFT JOIN registros r ON d.id = r.dispositivo
        WHERE s.hospital = ?
        GROUP BY 
          s.id, s.n_sala,
          d.id, d.n_dispositivo, d.referencia, d.api_key_inbiot
          ORDER BY ultimaActualizacion ASC
          ;`,[id]
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}

export async function getSalaByUser(id:number): Promise<Salas[]> {
  try {
    const [rows] = await executeQuery<Salas[] & RowDataPacket[]>(
      `SELECT s.*
      FROM salas AS s 
      JOIN usuarios_salas us ON s.id = us.sala_id 
      WHERE us.usuario_id = ?;`,[id]
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}

export async function getSalaAll(): Promise<Salas[]> {
  try {
    const [rows] = await executeQuery<Salas[] & RowDataPacket[]>(
      `SELECT * FROM salas;`
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}