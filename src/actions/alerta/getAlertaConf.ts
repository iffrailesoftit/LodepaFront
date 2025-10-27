"use server";

import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface ConfAlerta extends RowDataPacket {
    id: number;
    sala_id: number;
    n_sala:string; //monstrar
    hospital_id:number;
    hospital:string; //monstrar
    usuario_id: number;
    usuario_nombre:string; //monstrar
    usuario_apellido:string; //monstrar
    hora_min: number; //monstrar
    hora_max: number; //monstrar
}

export async function getAlertaConfByUsuario(id: number, rol: number): Promise<ConfAlerta[]> {
    try {
        let result;
        // CONTROL DE PERSMISOS
        if (rol === 1) {
            const [rows] = await executeQuery<ConfAlerta[] & RowDataPacket[]>(
                `SELECT ca.*, s.n_sala,h.id AS hospital_id, h.hospital, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
                    FROM configuracion_alertas ca
                    JOIN salas s ON ca.sala_id = s.id
                    JOIN hospitales h ON s.hospital = h.id
                    JOIN usuarios u ON ca.usuario_id = u.id;`
            );
            result= rows;
        }else{
            const [rows] = await executeQuery<ConfAlerta[] & RowDataPacket[]>(
            `SELECT ca.*, s.n_sala,h.id AS hospital_id, h.hospital, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
                FROM configuracion_alertas ca
                JOIN salas s ON ca.sala_id = s.id
                JOIN hospitales h ON s.hospital = h.id
                JOIN usuarios u ON ca.usuario_id = u.id;
                WHERE ca.usuario_id = ?;`, [id]
        );
        result= rows;
    }
        
        return result;
    } catch (error) {
        console.error("Error al obtener roles:", error);
        throw new Error("No se pudieron obtener los roles");
    }
}