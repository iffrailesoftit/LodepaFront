"use server";

import { executeQuery } from "@/lib/db";
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
        mensaje:"Hospital creado correctamente"
    }
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
   

    return{
        ok:1,
        mensaje:"Se ha actualizado correctamente"
    }
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
