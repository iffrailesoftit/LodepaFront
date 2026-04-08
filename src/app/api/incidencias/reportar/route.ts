import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";
import { createIncidenciaSchema } from "@/schemas/incidencias";

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  if (![1, 2, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Validación con Zod
    const validation = createIncidenciaSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { purificador_id, tipo_incidencia, descripcion } = validation.data;

    // El usuario que reporta se extrae del token – nunca del frontend
    const usuarioReportaId = session.id;

    const [result]: any = await executeQuery(
      `INSERT INTO mantenimiento_averias (purificador_id, tipo_incidencia, descripcion, usuario_reporta_id)
       VALUES (?, ?, ?, ?)`,
      [purificador_id, tipo_incidencia, descripcion.trim(), usuarioReportaId]
    );

    return NextResponse.json(
      { message: "Incidencia reportada correctamente", id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al reportar incidencia:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
