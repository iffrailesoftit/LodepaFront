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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: "Falta el ID del ticket" }, { status: 400 });
    }

    // El técnico asignado es el usuario autenticado – nunca viene del frontend
    const tecnicoId = session.id;

    const [result]: any = await executeQuery(
      `UPDATE mantenimiento_averias
          SET estado    = 'EN_PROCESO',
              usuario_id = ?
        WHERE id = ?
          AND estado = 'PENDIENTE'`,
      [tecnicoId, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "No se encontró el ticket o ya no está en estado PENDIENTE" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Ticket asignado correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al atender ticket:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
