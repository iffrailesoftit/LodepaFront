"use server";

import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface Rol extends RowDataPacket {
  id: number;
  rol: string;
}

export async function getRolAll(): Promise<Rol[]> {
  try {
    const [rows] = await executeQuery<Rol[] & RowDataPacket[]>(
      `SELECT * FROM roles;`
    );
    return rows;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
}

