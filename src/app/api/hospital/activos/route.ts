import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getSession } from "@/actions/auth/getSession";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const [rows]: any[] = await executeQuery(
      `SELECT id, hospital FROM hospitales WHERE fecha_baja IS NULL ORDER BY hospital ASC;`
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error al obtener hospitales activos:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
