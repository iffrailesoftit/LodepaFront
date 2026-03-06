"use server";

import { executeQuery, getConnection } from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
// import { redirect } from "next/navigation";

// Insertar Hospital
// Insertar Hospital
export async function crearHospital(formData: FormData) {
  const nombre = formData.get("Nombre") as string | null;
  const logoFile = formData.get("Logo") as File | null;
  let logoUrl = null;

  if (!nombre) {
    throw new Error("El nombre del hospital es requerido.");
  }

  try {
    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const uniqueName = `${Date.now()}-${logoFile.name.replace(/\s+/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/logos");
      
      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, uniqueName);
      await fs.writeFile(filePath, buffer);
      logoUrl = `/uploads/logos/${uniqueName}`;
    }

    await executeQuery(`INSERT INTO hospitales (hospital, logo) VALUES (?, ?)`, [
      nombre,
      logoUrl,
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
  const logoFile = formData.get("Logo") as File | null;
  const keepExistingLogo = formData.get("KeepExistingLogo") as string | null;

  if (!id || !nombre) {
    throw new Error("El ID y el nombre del hospital son requeridos.");
  }

  try {
    let logoUrl = null;

    if (logoFile && logoFile.size > 0) {
      // New logo uploaded
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const uniqueName = `${Date.now()}-${logoFile.name.replace(/\s+/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/logos");
      
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, uniqueName);
      await fs.writeFile(filePath, buffer);
      logoUrl = `/uploads/logos/${uniqueName}`;
    } else if (keepExistingLogo) {
      // No new file, but client told us to keep the existing one
      logoUrl = keepExistingLogo;
    }

    await executeQuery(`UPDATE hospitales SET hospital = ?, logo = ? WHERE id = ?`, [
      nombre,
      logoUrl,
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
