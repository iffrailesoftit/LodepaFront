"use server";
import db, { executeQuery } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function crearActualizarAlerta(alerta: any, parametros: any) {
  const actualizar = alerta.id !== 0;
  const connection = await db.getConnection();

  try {
    // Iniciar una transacción
    await connection.beginTransaction();
    // Crear o actualizar la sala
    if (actualizar) {
      // Actualizar la sala
      await connection.query(
        `UPDATE configuracion_alertas 
                            SET sala_id = ?, hora_min = ?, hora_max=?
                            WHERE id = ?`,
        [alerta.sala_id, alerta.hora_min, alerta.hora_max, alerta.id]
      );
    } else {
      // Insertar la sala
        const [result]: any =
      await connection.query(
        `INSERT INTO configuracion_alertas (sala_id, usuario_id, hora_min, hora_max) VALUES
	        (?, ?, ?, ?);`,
        [alerta.sala_id, alerta.usuario_id, alerta.hora_min, alerta.hora_max]
      );
      alerta.id = result.insertId;
    }
    // Insertar los parametros de la alerta
    
    // Insertar los parametros
    for (const parametro of parametros) {
      // console.log(parametro);
      await connection.query(
        `INSERT INTO umbrales_alertas (id_conf_alerta,id_parametro,min_warning,max_warning,estado)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          min_warning=?, 
          max_warning=?,
          estado=?;`,
        [
          alerta.id,
          parametro.id,
          Number(parametro.min_warning),
          Number(parametro.max_warning),
          parametro.enabled,
          Number(parametro.min_warning),
          Number(parametro.max_warning),
          parametro.enabled,
        ]
      );
    }

    // Confirmar la transacción si todo fue correcto
    await connection.commit();
  } catch (error) {
    console.error("Error al actualizar alertas:", error);
    // Si hay error, revertir la transacción
    await connection.rollback();
    throw error;
  } finally {
    // Liberar la conexión para que vuelva al pool
    connection.release();
  }

  if (actualizar) {
    return "Se ha actualizado correctamente";
  } else {
    return "Se ha creado la Alerta ";
  }
}

// Actualizar Conf-Alerta en la base de datos
export async function updateCrearAlerta(formData: FormData, parametros: any[]) {
  try {
    // Obtener los datos del formulario
    const alerta: any = {
      id: Number(formData.get("id") ?? 0),
      usuario_id: Number(formData.get("usuario_id") ?? 0),
      hospital_id: Number(formData.get("hospital_id") ?? 0),
      sala_id: Number(formData.get("sala_id") ?? 0),
      hora_min: Number(formData.get("hora_min") ?? 0),
      hora_max: Number(formData.get("hora_max") ?? 0),
    };

    // Validar campos obligatorios
    if (!alerta.sala_id) {
      throw new Error("Faltan campos obligatorios");
    }

    const mensaje = await crearActualizarAlerta(alerta, parametros);

    // Revalidar la ruta para actualizar los datos en la UI
    revalidatePath(`/dashboard/alertas`);
    return {
      ok: 1,
      mensaje: mensaje,
    };
  } catch (error) {
    console.error("Error al actualizar alertas:", error);
    // En lugar de devolver un objeto de error, se relanza la excepción
    throw error;
  }
}

export async function deleteAlerta(formData: FormData) {
  try {
    // Obtener los datos del formulario
    const alertaId = Number(formData.get("alertaId") ?? 0);

    // Validar campos obligatorios
    if (!alertaId) {
      throw new Error("Faltan campos obligatorios");
    }
    await executeQuery(`Delete from configuracion_alertas where id = ?`, [
      alertaId,
    ]);

    // Revalidar la ruta para actualizar los datos en la UI
    revalidatePath(`/dashboard/alertas`);
    return {
      ok: 1,
      mensaje: "Se ha eliminado correctamente",
    };
  } catch (error) {
    console.error("Error al eliminar alertas:", error);
    // En lugar de devolver un objeto de error, se relanza la excepción
    throw error;
  }
}
