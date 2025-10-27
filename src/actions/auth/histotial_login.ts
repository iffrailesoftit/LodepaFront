'use server';
import { executeQuery } from '@/lib/db';
import { cookies } from 'next/headers';
export async function guardarHistorialSesion(id: number, fechaEmision: number, fechaExpiracion: number, token: string) {
    try {
        const fecha_emision = new Date(fechaEmision * 1000);
        // console.log('Fecha de emisión:', fecha_emision.toISOString());
        const fecha_expiracion = new Date(fechaExpiracion * 1000);
        // console.log('Fecha de expiración:', fecha_expiracion.toISOString());
        await executeQuery('INSERT INTO historial_login (user, fecha_login, fecha_expiracion, token) VALUES (?, ?, ?, ?);', [
            id,
            fecha_emision,
            fecha_expiracion,
            token,
        ]);
        return;
    } catch (error) {
        console.error('Error al guardar el historial de sesión:', error);
    }
}

export async function logoutHistorialSesion() {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) {
            throw new Error('No se encontró token en las cookies');
        }
        // console.log('Token encontrado:', token);
        const now = new Date();
        await executeQuery('UPDATE historial_login SET fecha_logout = ? WHERE token = ?;', [
            now,
            token,
        ]);
        // console.log('historial:', historial);
    } catch (err) {
    console.error('Token inválido o expirado', err);
}
}

