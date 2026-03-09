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
    min_good: number;
    max_good: number;
    min_warning: number;
    max_warning: number;
    estado: boolean;
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
                `SELECT
                    t.rowid,
                    t.parametro,
                    t.min_good,
                    t.max_good,
                    t.min_warning,
                    t.max_warning,
                    t.estado
                FROM (
                    SELECT
                        u.rowid,
                        u.parametro,
                        u.min_good,
                        u.max_good,
                        COALESCE(ua.min_warning, u.min_warning) AS min_warning,
                        COALESCE(ua.max_warning, u.max_warning) AS max_warning,
                        ua.estado,
                        ROW_NUMBER() OVER (
                            PARTITION BY u.rowid
                            ORDER BY
                                COALESCE(ua.max_warning, u.max_warning) DESC,
                                ua.rowid DESC
                        ) AS rn
                    FROM umbrales u
                    JOIN dispositivos d
                        ON d.id = ?
                    LEFT JOIN configuracion_alertas ca
                        ON ca.sala_id = d.sala
                    AND HOUR(NOW()) BETWEEN ca.hora_min AND ca.hora_max
                    LEFT JOIN umbrales_alertas ua
                        ON ua.id_parametro = u.rowid
                    AND ua.id_conf_alerta = ca.id
                ) t
                WHERE t.rn = 1;`
            ,[id_dispositivo]);
            return rows;
    } catch (error) {
        console.error("Error al obtener roles:", error);
        throw new Error("No se pudieron obtener los roles");
    }
}