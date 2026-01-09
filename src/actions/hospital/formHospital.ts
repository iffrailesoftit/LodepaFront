"use server";

import { executeQuery, getConnection } from "@/lib/db";
import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";

// Insertar Hospital
export async function crearHospital(formData: FormData) {
  const nombre = formData.get("Nombre") as string | null;

  if (!nombre) {
    throw new Error("El nombre del hospital es requerido.");
  }
  try {
    await executeQuery(`INSERT INTO hospitales (hospital) VALUES (?)`, [
      nombre,
    ]);
  } catch (error) {
    console.error("Error al crear el hospital:", error);
    throw new Error("Error en la base de datos al crear el hospital.");
  }
  revalidatePath(`/dashboard/admin/hospital`);

  return {
    mensaje: "Hospital creado correctamente",
  };
}

// Actualizar Hospital
export async function updateHospital(formData: FormData) {
  const id = formData.get("Id") as string | null;
  const nombre = formData.get("Nombre") as string | null;

  if (!id || !nombre) {
    throw new Error("El ID y el nombre del hospital son requeridos.");
  }

  try {
    await executeQuery(`UPDATE hospitales SET hospital = ? WHERE id = ?`, [
      nombre,
      id,
    ]);
  } catch (error) {
    console.error("Error al actualizar el hospital:", error);
    throw new Error("Error en la base de datos al actualizar el hospital.");
  }
  revalidatePath(`/dashboard/admin`);

  return {
    ok: 1,
    mensaje: "Se ha actualizado correctamente",
  };
}

// Eliminar Hospital
export async function deleteHospital(formData: FormData) {
  const id = formData.get("Id") as string | null;

  if (!id) {
    throw new Error("El ID del hospital es requerido.");
  }

  try {
    await executeQuery(`DELETE FROM hospitales WHERE id = ?`, [id]);
  } catch (error) {
    console.error("Error al eliminar el hospital:", error);
    throw new Error("Error en la base de datos al eliminar el hospital.");
  }
  revalidatePath(`/dashboard/admin/hospital`);
}

// Dar de Baja Hospital
export async function BajaHospital(formData: FormData) {
  const id = formData.get("Id")?.toString();
  if (!id) throw new Error("**El ID del hospital es requerido.**");

  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE hospitales 
   SET fecha_baja = NOW() 
   WHERE id = ?`,
      [id]
    );

    await conn.query(
      `UPDATE salas AS s
   LEFT JOIN dispositivos d ON s.id = d.sala
   SET 
     s.fecha_baja = NOW(),
     d.encendido = "N",
     d.referencia = CONCAT(d.referencia, "_", CURDATE())
   WHERE s.hospital = ?`,
      [id]
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    console.error("**Error al dar de baja:**", error);
    throw new Error("**Error al dar de baja el hospital.**");
  } finally {
    conn.release();
  }
}

// Dar de Alta Hospital
export async function altaHospital(formData: FormData) {
  const id = formData.get("Id")?.toString();
  if (!id) throw new Error("**El ID del hospital es requerido.**");

  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE hospitales 
   SET fecha_baja = NULL 
   WHERE id = ?`,
      [id]
    );

    await conn.query(
      `UPDATE salas AS s
   LEFT JOIN dispositivos d ON s.id = d.sala
   SET 
     s.fecha_baja = NULL,
     d.encendido = "S"
   WHERE s.hospital = ?`,
      [id]
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    console.error("**Error al dar de alta:**", error);
    throw new Error("**Error al dar de alta el hospital.**");
  } finally {
    conn.release();
  }
}
