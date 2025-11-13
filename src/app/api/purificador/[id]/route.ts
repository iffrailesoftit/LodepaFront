import { getSession } from "@/actions/auth/getSession";
import { getPurificadorBySala } from "@/actions/purificadores/getPurificador";
import { NextResponse } from "next/server";

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

  console.log("ID recibido:", id);

  // 2. Convertir a número
  const salaId = parseInt(id, 10);

  if (isNaN(salaId)) {
    return NextResponse.json(
      { success: false, message: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    // Consulta a la base de datos
    const purificador = await getPurificadorBySala(id);

    console.log(purificador);

    return NextResponse.json(purificador, { status: 200 });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
