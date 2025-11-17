"use server";
import db, { executeQuery, getConnection } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function checkRefExists(
  ref: string,
  sala: number
): Promise<boolean> {
  try {
    // Se realiza la consulta para obtener usuarios que tengan el email proporcionado
    const [existingRef] = await executeQuery(
      `SELECT sala, referencia FROM dispositivos WHERE referencia = ?`,
      [ref]
    );
    // Si no se encontró ningún registro, el email no está en uso
    if (!existingRef || existingRef.length === 0) {
      return false;
    }

    // Si existe algún usuario con este email que no sea el usuario actual, devolvemos true.
    return existingRef.some((dispositivo: any) => dispositivo.sala !== sala);
  } catch (error) {
    console.error("Error al verificar la referencia:", error);
    // En caso de error, asumimos que el email podría estar en uso para evitar conflictos
    return true;
  }
}

async function crearActualizarSala(sala: any) {
  const actualizar = sala.id !== 0;
  // const n_dispositivo = `Dip. ${sala.nombre}`;
  const n_dispositivo = sala.n_dispositivo;
  const connection = await db.getConnection();

  try {
    // Iniciar una transacción
    await connection.beginTransaction();
    // Crear o actualizar la sala
    if (actualizar) {
      // Actualizar la sala
      await connection.query(`UPDATE salas SET n_sala = ? WHERE id = ?`, [
        sala.nombre,
        sala.id,
      ]);
      await connection.query(
        `UPDATE dispositivos SET n_dispositivo = ?, referencia = ?, api_key_inbiot = ? WHERE sala = ?`,
        [n_dispositivo, sala.referencia, sala.apikey, sala.id]
      );
    } else {
      // Insertar la sala
      const [result]: any = await connection.query(
        `INSERT INTO salas (n_sala, hospital) VALUES (?,?)`,
        [sala.nombre, sala.id_hospital]
      );
      const id_sala = result.insertId;

      await connection.query(
        `INSERT INTO dispositivos (n_dispositivo,referencia, api_key_inbiot, sala) VALUES (?,?,?,?)`,
        [n_dispositivo, sala.referencia, sala.apikey, id_sala]
      );
    }
    // Confirmar la transacción si todo fue correcto
    await connection.commit();
  } catch (error) {
    // Si hay error, revertir la transacción
    await connection.rollback();
    throw error;
  } finally {
    // Liberar la conexión para que vuelva al pool
    connection.release();
  }

  // Revalidar la ruta para actualizar los datos en la UI
  revalidatePath(`/dashboard/admin/hospital/${sala.id_hospital}/salas`);

  if (actualizar) {
    return "Se ha actualizado correctamente";
  } else {
    return "Se ha creado la Sala ";
  }
}

// Actualizar Salas en la base de datos
export async function updateCrearSala(formData: FormData) {
  try {
    // Obtener los datos del formulario
    const sala: any = {
      id: Number(formData.get("id") ?? 0),
      id_hospital: Number(formData.get("id_hospital") ?? 0),
      nombre: ((formData.get("sala") as string) || "").trim(),
      n_dispositivo: ((formData.get("n_dispositivo") as string) || "").trim(),
      referencia: ((formData.get("referencia") as string) || "").replace(
        /\s+/g,
        ""
      ),
      apikey: ((formData.get("apikey") as string) || "").replace(/\s+/g, ""),
    };

    console.log(sala);

    // Validar campos obligatorios
    if (!sala.nombre || !sala.referencia || !sala.apikey) {
      throw new Error("Faltan campos obligatorios");
    }

    const existeRef = await checkRefExists(sala.referencia, sala.id);
    if (existeRef) {
      throw new Error("La referencia ya está en uso");
    }
    const mensaje = await crearActualizarSala(sala);

    return {
      ok: 1,
      mensaje: mensaje,
    };
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    // En lugar de devolver un objeto de error, se relanza la excepción
    throw error;
  }
}

export async function BajaSala(formData: FormData) {
  const id = formData.get("Id")?.toString();
  if (!id) throw new Error("**El ID de la sala es requerido.**");

  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE salas 
       SET fecha_baja = NOW() 
       WHERE id = ?`,
      [id]
    );

    await conn.query(
      `UPDATE dispositivos 
        set encendido = "N"
       WHERE sala = ?`,
      [id]
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    console.error("**Error al dar de baja la sala:**", error);
    throw new Error("**Error al dar de baja la sala.**");
  } finally {
    conn.release();
  }
}

export async function altaSala(formData: FormData) {
  const id = formData.get("Id")?.toString();
  if (!id) throw new Error("**El ID de la sala es requerido.**");

  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE salas 
       SET fecha_baja = NULL 
       WHERE id = ?`,
      [id]
    );

    await conn.query(
      `UPDATE dispositivos 
          set encendido = "S"
       WHERE sala = ?`,
      [id]
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    console.error("**Error al dar de alta la sala:**", error);
    throw new Error("**Error al dar de alta la sala.**");
  } finally {
    conn.release();
  }
}
