"use server";

import { executeQuery } from '@/lib/db';

export async function updateEstadoDip(formData: FormData) {
  try {
    // console.log(formData.get("encendido"));
    await executeQuery(
      `UPDATE dispositivos SET encendido = ? WHERE id = ?`,
      [formData.get("encendido"), formData.get("id")]
    );
    if(formData.get("encendido")==="S"){
      return {
        ok: 1,
        mensaje: "Dispositivo encendido correctamente"
      }
    }else{
      return {
        ok: 2,
        mensaje: "Dispositivo apagado correctamente"
      }
    }
  } catch (error) {
    console.error("Error al actualizar estado DIP:", error);
    throw new Error("No se pudieron actualizar el estado del dispositivo");
  }
}
