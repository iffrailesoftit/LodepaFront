import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function PATCH(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  if (![1, 2, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, encendido } = body;

    if (!id || encendido === undefined) {
      return NextResponse.json({ message: "Petición inválida" }, { status: 400 });
    }

    const [result]: any = await executeQuery(
      `UPDATE purificadores SET encendido = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
      [encendido, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "No se encontró el purificador" }, { status: 404 });
    }

    return NextResponse.json({ message: "Estado actualizado" }, { status: 200 });
  } catch (error) {
    console.error("Error al cambiar estado del purificador:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
