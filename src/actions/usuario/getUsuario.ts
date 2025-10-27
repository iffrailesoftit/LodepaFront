"use server";

import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface Usuario {
  id: number;
  apellido: string;
  email: string;
  nombre: string;
  telefono: string | null;
  password: string;
  rol: {
    id: number;
    rol: string;
  };
  hospitales: {
    id: number;
    hospital: string;
    salas: {
      id: number;
      n_sala: string;
    }[];
  }[];
}

function pasar(rows:any){
  // 1. Mapa para agrupar por usuario
  const userMap: Record<number, Usuario> = {};

  for (const row of rows) {
    // Si no existe el usuario en el map, lo creamos
    if (!userMap[row.id]) {
      userMap[row.id] = {
        id: row.id,
        apellido: row.apellido,
        email: row.email,
        nombre: row.nombre,
        password: row.password,
        telefono: row.telefono,
        rol: {
          id: row.id_rol,
          rol: row.n_rol,
        },
        hospitales: [],
      };
    }

    const usuario = userMap[row.id];

    // 2. Si la fila tiene un hospital válido, buscamos o creamos ese hospital en usuario.hospitales
    if (row.id_hospital && row.n_hospital) {
      // Buscamos si ya existe en el array
      let hospital = usuario.hospitales.find(
        (h) => h.id === row.id_hospital
      );

      // Si no existe, lo creamos
      if (!hospital) {
        hospital = {
          id: row.id_hospital,
          hospital: row.n_hospital,
          salas: [],
        };
        usuario.hospitales.push(hospital);
      }

      // 3. Si la fila tiene una sala válida, la agregamos al array de ese hospital
      if (row.id_sala && row.n_sala) {
        // Verificamos si la sala ya existe para no duplicar
        const salaExiste = hospital.salas.some(
          (sala) => sala.id === row.id_sala
        );
        if (!salaExiste) {
          hospital.salas.push({
            id: row.id_sala,
            n_sala: row.n_sala,
          });
        }
      }
    }
  }

  // Convertimos el map en un array
  return Object.values(userMap);
}

export const getVerUsuarioAll = async (): Promise<Usuario[]> => {
  const [rows] = await executeQuery<any[]>(`
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.password,
      u.telefono,
      u.rol AS id_rol,
      r.rol AS n_rol,
      uh.hospital_id AS id_hospital,
      h.hospital AS n_hospital,
      us.sala_id AS id_sala,
      us.n_sala
    FROM usuarios u
    JOIN roles r ON u.rol = r.id
    LEFT JOIN usuarios_hospitales uh ON u.id = uh.usuario_id
    LEFT JOIN hospitales h ON uh.hospital_id = h.id
    LEFT JOIN (
      SELECT 
        us.usuario_id, 
        us.sala_id, 
        s.hospital, 
        s.n_sala
      FROM usuarios_salas us
      JOIN salas s ON us.sala_id = s.id
    ) AS us ON u.id = us.usuario_id AND us.hospital = uh.hospital_id;
  `);

    return pasar(rows);
};

export const getVerUsuariobyId = async (id:number): Promise<Usuario[]> => {
  const [rows] = await executeQuery<any[]>(`
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.password,
      u.telefono,
      u.rol AS id_rol,
      r.rol AS n_rol,
      uh.hospital_id AS id_hospital,
      h.hospital AS n_hospital,
      us.sala_id AS id_sala,
      us.n_sala
    FROM usuarios u
    JOIN roles r ON u.rol = r.id
    LEFT JOIN usuarios_hospitales uh ON u.id = uh.usuario_id
    LEFT JOIN hospitales h ON uh.hospital_id = h.id
    LEFT JOIN (
      SELECT 
        us.usuario_id, 
        us.sala_id, 
        s.hospital, 
        s.n_sala
      FROM usuarios_salas us
      JOIN salas s ON us.sala_id = s.id
    ) AS us ON u.id = us.usuario_id AND us.hospital = uh.hospital_id
    WHERE u.id = ?;
  `,[id]);

    return pasar(rows);
};

export interface UsuarioSala extends RowDataPacket {
  id: number;
  apellido: string;
  nombre: string;
  email: string;
  id_sala: number;
  n_sala: string;
  id_hospital: number;
  n_hospital: string;
}

export async function getUsuarioSalas(sala_id: number): Promise<UsuarioSala[]> {

  try {
  const [rows] = await executeQuery<UsuarioSala[]>(`
    SELECT DISTINCT(u.id),
      u.nombre,
      u.apellido,
      u.email,
      u.rol,
      s.id AS id_sala,
      s.n_sala,
      h.id AS id_hospital,
      h.hospital AS n_hospital
    FROM usuarios u
    LEFT JOIN usuarios_hospitales uh ON u.id = uh.usuario_id
    LEFT JOIN hospitales h ON uh.hospital_id = h.id
    LEFT JOIN salas s ON h.id = s.hospital
    WHERE s.id = ?
    UNION 
    SELECT DISTINCT(u.id),
      u.nombre,
      u.apellido,
      u.email,
      u.rol,
      s.id AS id_sala,
      s.n_sala,
      h.id AS id_hospital,
      h.hospital AS n_hospital
    FROM usuarios u
    JOIN hospitales h 
    LEFT JOIN salas s ON h.id = s.hospital
    WHERE (s.id = ?) AND (u.rol = 1);
    `,[sala_id,sala_id]);

  return rows; 
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron obtener los roles");
  }
} 