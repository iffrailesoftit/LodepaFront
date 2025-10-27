import { NextResponse } from "next/server";
import { getSalaByHospital } from "@/actions/hospital/sala/getSala";
import { getSession } from "@/actions/auth/getSession";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }
    // 1. Esperar a que se resuelvan los parámetros
    const { id } = await context.params;
  
    // 2. Convertir a número
    const hospitalId = parseInt(id, 10);

  if (isNaN(hospitalId)) {
    return NextResponse.json(
      { success: false, message: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    // Consulta a la base de datos
    const salas = await getSalaByHospital(hospitalId);
    return NextResponse.json(salas, { status: 200 });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
