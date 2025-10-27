"use server";

import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface Hospital extends RowDataPacket {
  id: number;
  hospital: string;
}

export async function getHospitalAll(): Promise<Hospital[]> {
  try {
    const [rows] = await executeQuery<Hospital[] & RowDataPacket[]>(
      `SELECT * FROM hospitales;`
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}

export async function getHospitalByID(id: number): Promise<Hospital> {
  try {
    const rows = await executeQuery<Hospital & RowDataPacket[]>(
      `SELECT * FROM hospitales WHERE id = ?;`,
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}

export async function getHospitalAllyNumeroSalas(): Promise<any[]> {
  try {
    const [rows] = await executeQuery<any[] & RowDataPacket[]>(
      `SELECT h.*, COUNT(s.id) AS num_salas
      FROM hospitales h
      LEFT JOIN salas s ON h.id = s.hospital
      GROUP BY h.id;`
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}

export async function getHospitalByUser(userID:number): Promise<Hospital[]> {
  try {
    const [rows] = await executeQuery<Hospital[] & RowDataPacket[]>(
      `SELECT h.* FROM hospitales h
      JOIN usuarios_hospitales uh ON h.id=uh.hospital_id
      WHERE uh.usuario_id = ?;`,[userID]
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}
