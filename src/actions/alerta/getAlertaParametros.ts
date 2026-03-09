"use server";

import { executeQuery } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export interface ParametrosAlerta extends RowDataPacket {
    rowid: number;
    parametro: string;
    id_umbral_alerta: number;
    id_conf_alerta: number;
    min_warning: number;
    max_warning: number;
    estado: boolean;
}

export interface UmbralAlerta extends RowDataPacket {
    rowid: number;
    parametro: string;
    id_umbral_alerta: number;
    id_conf_alerta: number;
    min_good: number;
    max_good: number;
    min_warning: number;
    max_warning: number;
    estado: boolean;
    rn: number;
}

export async function getParametrosAlerta(id_conf_alerta:number): Promise<ParametrosAlerta[]> {
    try {
            const [rows] = await executeQuery<ParametrosAlerta[] & RowDataPacket[]>(
                `SELECT
                    u.rowid                        AS rowid,
                    u.parametro AS parametro,
                    ua.rowid as id_umbral_alerta,
                    ua.id_conf_alerta,
                    COALESCE(ua.min_warning, u.min_warning)   AS min_warning,
                    COALESCE(ua.max_warning, u.max_warning)   AS max_warning,
                    ua.estado
                    FROM umbrales AS u
                    LEFT JOIN umbrales_alertas AS ua
                    ON ua.id_parametro   = u.rowid
                    AND ua.id_conf_alerta = ?; `
            ,[id_conf_alerta]);
            return rows;
    } catch (error) {
        console.error("Error al obtener roles:", error);
        throw new Error("No se pudieron obtener los roles");
    }
}

export async function getUmbrales(id_dispositivo:number): Promise<UmbralAlerta[]> {
    try {
            const [rows] = await executeQuery<UmbralAlerta[] & RowDataPacket[]>(
                `SELECT *
                    FROM (
                        SELECT
                            u.rowid,
                            u.parametro,
                            ua.rowid AS id_umbral_alerta,
                            ua.id_conf_alerta,
                            u.min_good,
                            u.max_good,
                            COALESCE(ua.min_warning, u.min_warning)   AS min_warning,
                            COALESCE(ua.max_warning, u.max_warning)   AS max_warning,
                            ua.estado,
                            ROW_NUMBER() OVER (PARTITION BY u.rowid ORDER BY ua.max_warning DESC) AS rn
                        FROM umbrales u
                        JOIN umbrales_alertas ua ON ua.id_parametro = u.rowid
                        JOIN configuracion_alertas ca ON ca.id = ua.id_conf_alerta
                        JOIN dispositivos d ON d.sala = ca.sala_id
                        WHERE d.id = ?
                        AND HOUR(NOW()) BETWEEN ca.hora_min AND ca.hora_max
                    ) t
                    WHERE rn = 1; `
            ,[id_dispositivo]);
            return rows;
    } catch (error) {
        console.error("Error al obtener roles:", error);
        throw new Error("No se pudieron obtener los roles");
    }
}