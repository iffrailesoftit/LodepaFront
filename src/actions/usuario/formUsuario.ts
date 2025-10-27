// /app/usuarios/actions.ts
"use server";

import db, { executeQuery } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface UserHospital {
  hospitalId: number
  salaIds: number[]
}

interface UserFormData {
  id: number
  nombre: string
  apellido: string
  email: string
  password: string
  telefono: string
  rol: number
  userHospitales: UserHospital[]
}

async function crearActualizarUsuario(user: UserFormData) {

  const actualizar = user.id!==0;
  // Obtener una conexión del pool
  const connection = await db.getConnection();
  try {
    // Iniciar la transacción
    await connection.beginTransaction();

    // Crear o actualizar el usuario
    if (actualizar) {
      // Actualizar usuario
      await connection.query(
        `
        UPDATE usuarios
        SET nombre = ?, apellido = ?, email = ?, password = ?, telefono = ?, rol = ?
        WHERE id = ?
        `,
        [user.nombre, user.apellido, user.email, user.password, user.telefono, user.rol, user.id]
      );
    } else {
      // Crear usuario y asignar el id generado al objeto
      const [result]: any = await connection.query(
        `
        INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [user.nombre, user.apellido, user.email, user.password, user.telefono, user.rol]
      );
      user.id = result.insertId;
    }

    // Eliminar hospitales y salas asociadas al usuario
    await connection.query(`DELETE FROM usuarios_hospitales WHERE usuario_id = ?`, [user.id]);
    await connection.query(`DELETE FROM usuarios_salas WHERE usuario_id = ?`, [user.id]);

    // Insertar hospitales y salas asociadas al usuario
    for (const userHospital of user.userHospitales) {
      await connection.query(
        `
        INSERT INTO usuarios_hospitales (usuario_id, hospital_id)
        VALUES (?, ?)
        `,
        [user.id, userHospital.hospitalId]
      );

      // Insertar cada sala asociada al usuario en este hospital
      for (const salaId of userHospital.salaIds) {
        await connection.query(
          `
          INSERT INTO usuarios_salas (usuario_id, sala_id)
          VALUES (?, ?)
          `,
          [user.id, salaId]
        );
      }
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
  if(actualizar) {
    // Revalidar la ruta para actualizar los datos en la UI
    revalidatePath(`/dashboard/admin/usuario/${user.id}`);
    
    return {
      ok:2,
      mensaje:"Se ha actualizado correctamente"
    }
    }else{
      return{
        ok:1,
        mensaje:"Se ha creado el Usuario correctamente",
        patch:`/dashboard/admin/usuario/${user.id}`
      }
    }
}


export async function checkEmailExists(email: string, userId: number): Promise<boolean> {
  try {
    // Se realiza la consulta para obtener usuarios que tengan el email proporcionado
    const [existingEmails] = await executeQuery(
      `SELECT id, email FROM usuarios WHERE email = ?`,
      [email]
    );

    // Si no se encontró ningún registro, el email no está en uso
    if (!existingEmails || existingEmails.length === 0) {
      return false;
    }

    // Si existe algún usuario con este email que no sea el usuario actual, devolvemos true.
    return existingEmails.some((usuario: any) => usuario.id !== userId);
  } catch (error) {
    console.error("Error al verificar email:", error);
    // En caso de error, asumimos que el email podría estar en uso para evitar conflictos
    return true;
  }
}


// Eliminar usuario
export async function deleteUser(formData: FormData) {
  const userId = formData.get("userId");
  if (!userId) return;

  await executeQuery(`DELETE FROM usuarios WHERE id = ?`, [userId]);

  // Revalidamos la ruta /usuarios para que se vea reflejado el cambio
  revalidatePath(`/dashboard/admin`);
}

// Editar usuario
export async function editUser(formData: FormData) {
  try {
    // Extraer los hospitales (devuelve un array de strings, por eso se mapea a Number)
    const hospitales = formData.getAll("hospitales").map((h) => Number(h));

    // Crear un objeto para almacenar las salas por hospital
    const hospitalSalas: Record<number, number[]> = {};
    hospitales.forEach((hospitalId) => {
      const salas = formData.getAll(`salas-${hospitalId}`).map((s) => Number(s));
      hospitalSalas[hospitalId] = salas;
    });

    // Transformar el objeto hospitalSalas en un array de UserHospital
    const userHospitales = Object.keys(hospitalSalas).map((key) => ({
      hospitalId: Number(key),
      salaIds: hospitalSalas[Number(key)],
    }));

    // Construir el objeto UserFormData
    const user: UserFormData = {
      id: Number(formData.get("id")),
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      telefono: formData.get("telefono") as string,
      rol: Number(formData.get("rol")),
      userHospitales,
    };

    // Validar campos obligatorios
    if (!user.nombre || !user.apellido || !user.email || !user.password) {
      throw new Error("Faltan campos obligatorios");
    }

    // Verificar si el email ya está en uso por otro usuario
    const emailExists = await checkEmailExists(user.email, user.id);
    if (emailExists) {
      throw new Error("El email ya está siendo utilizado por otro usuario");
    }

    const mensaje = await crearActualizarUsuario(user);

    return mensaje;

  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    // En lugar de devolver un objeto de error, se relanza la excepción
    throw error;
  }
}