"use server";
import { executeQuery } from "@/lib/db";
// import { RowDataPacket } from "mysql2/promise";

export interface accionPurificador {
  id: number;
  purificador: string;
  accion: string;
  fecha: Date;
  tipo: number;
  valor: string;
}

export interface Purificador {
  id: string;
  estado: number;
  id_sala: number;
  encendido: number;
  tipo_placa: number;
  velocidad_ventiladores: number;
  fecha_alta: Date;
  lampara_actual: number;
  fecha_actualizacion: Date;
  estado_actual: number;
  estado_maquina: number;
}

export async function getPurificador(id: string) {
  const [rows]: any[] = await executeQuery(
    `SELECT * FROM purificadores p WHERE p.id = ?`,
    [id]
  );

  return rows[0] as Purificador;
}

export async function getPurificadorBySala(id: string) {
  const [rows]: any[] = await executeQuery(
    `SELECT * FROM purificadores p WHERE p.sala = ?`,
    [id]
  );

  return rows[0] as Purificador;
}


export async function getAccionesPurificador(id: string) {
  const [rows]: any[] = await executeQuery(
    `SELECT * FROM acciones_purificador WHERE purificador = ?`,
    [id]
  );

  return rows as accionPurificador[];
}