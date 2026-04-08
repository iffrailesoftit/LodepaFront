import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function PUT(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { purificadorId, salaId } = body;

    if (!purificadorId || salaId === undefined) {
      return NextResponse.json(
        { message: "Faltan parámetros requeridos: purificadorId y salaId" },
        { status: 400 }
      );
    }

    const [result]: any = await executeQuery(
      `UPDATE purificadores SET sala = ? WHERE id = ?;`,
      [salaId, purificadorId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "No se encontró el purificador o no hubo cambios" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Purificador asignado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al asignar sala al purificador:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
