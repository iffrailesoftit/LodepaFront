import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getSession } from "@/actions/auth/getSession";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");

  if (!hospitalId) {
    return NextResponse.json(
      { message: "Falta el parámetro hospitalId" },
      { status: 400 }
    );
  }

  try {
    const [rows]: any[] = await executeQuery(
      `SELECT id, n_sala FROM salas WHERE hospital = ? AND fecha_baja IS NULL ORDER BY n_sala ASC;`,
      [hospitalId]
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error al obtener salas activas:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
