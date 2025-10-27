// app/api/hospital/listadoSala/route.ts
import { NextResponse } from "next/server";
import { getListadoSalas } from "@/actions/hospital/sala/getListadoSalas";
import { getSession } from "@/actions/auth/getSession";

export async function GET(request: Request) {
  
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  // Extraemos los parámetros de la query string
  const { searchParams } = new URL(request.url);
  const id_hospital = searchParams.get("id_hospital");
  const id = searchParams.get("id");
  const rol = searchParams.get("rol");

  if (!id_hospital || !id || !rol) {
    return NextResponse.json(
      { message: "Faltan parámetros: id_hospital, id y rol son obligatorios" },
      { status: 400 }
    );
  }

  const idHospitalNum = Number(id_hospital);
  const idNum = Number(id);
  const rolNum = Number(rol);

  try {
    const listado = await getListadoSalas(idHospitalNum, idNum, rolNum);
    return NextResponse.json(listado, { status: 200 });
  } catch (error) {
    console.error("Error al obtener listado de salas:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
