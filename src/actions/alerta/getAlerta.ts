"use server";

import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface Alerta extends RowDataPacket {
    id: number;
    sala_id: number;
    usuario_id: number;
    alerta: string;
    campo: string;
    valor: number;
    fecha: Date;
    registro_id: number;
    solventada: string;
    n_sala:string;
    hospital_id:number;
    hospital:string;
}

export async function getAlertaByUsuario(id: number,rol: number): Promise<Alerta[]> {
    try {

        let request;
        // CONTROL DE PERSMISOS
        if(rol === 1){
            const [rows] = await executeQuery<Alerta[] & RowDataPacket[]>(
                `SELECT 
                    MIN(a.id) AS id,
                    a.sala_id,
                    a.campo,
                    a.alerta,
                    a.valor,
                    a.fecha,
                    a.registro_id,
                    a.solventada,
                    s.n_sala,
                    h.id AS hospital_id,
                    h.hospital
                    FROM alertas a
                                        JOIN salas s ON a.sala_id = s.id
                                        JOIN hospitales h ON s.hospital = h.id
                    GROUP BY 
                    a.sala_id,
                    a.alerta,
                    a.campo,
                    a.valor,
                    a.fecha,
                    a.registro_id,
                    a.solventada,
                    s.n_sala,
                    hospital_id,
                    h.hospital
                    ORDER BY a.fecha DESC;`
            );
            request= rows;
        }else{
        const [rows] = await executeQuery<Alerta[] & RowDataPacket[]>(
            `SELECT a.*, s.n_sala,h.id AS hospital_id, h.hospital
                FROM alertas a
                JOIN salas s ON a.sala_id = s.id
                JOIN hospitales h ON s.hospital = h.id
                WHERE a.usuario_id = ?
                ORDER BY a.fecha DESC;`, [id]
        );
        request= rows;
    }
        return request;
    } catch (error) {
        console.error("Error al obtener roles:", error);
        throw new Error("No se pudieron obtener los roles");
    }
}