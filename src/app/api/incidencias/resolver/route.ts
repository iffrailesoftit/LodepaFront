import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function PATCH(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  if (![1, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, comentario_resolucion } = body;

    if (!id || !comentario_resolucion?.trim()) {
      return NextResponse.json(
        { message: "Faltan datos requeridos (id, comentario_resolucion)" },
        { status: 400 }
      );
    }

    const [result]: any = await executeQuery(
      `UPDATE mantenimiento_averias
          SET estado               = 'RESUELTO',
              fecha_resolucion     = CURRENT_TIMESTAMP,
              comentario_resolucion = ?
        WHERE id     = ?
          AND estado = 'EN_PROCESO'`,
      [comentario_resolucion.trim(), id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "No se encontró el ticket o ya no está EN_PROCESO" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Ticket resuelto correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al resolver ticket:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
