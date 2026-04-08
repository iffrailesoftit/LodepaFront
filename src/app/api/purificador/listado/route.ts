import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  if (![1, 2, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 15;
  const offset = (page - 1) * limit;
  const hospital_nombre = searchParams.get("hospital_nombre") || "";
  const purificador_id = searchParams.get("purificador_id") || "";

  try {
    const whereConditions = [];
    const queryParams: any[] = [];

    if (hospital_nombre) {
      whereConditions.push("h.hospital LIKE ?");
      queryParams.push(`%${hospital_nombre}%`);
    }

    if (purificador_id) {
      whereConditions.push("p.id LIKE ?");
      queryParams.push(`%${purificador_id}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Query para obtener los datos
    const dataQuery = `
      SELECT 
        p.*, 
        s.n_sala, 
        h.hospital AS nombre_hospital,
        dp.fecha_alta AS dp_fecha_alta,
        dp.fecha_fabricacion AS dp_fecha_fabricacion,
        dp.version_software AS dp_version_software
      FROM purificadores p
      LEFT JOIN salas s ON p.sala = s.id
      LEFT JOIN hospitales h ON s.hospital = h.id
      LEFT JOIN datos_purificadores dp ON p.id = dp.id
      ${whereClause}
      ORDER BY p.id ASC
      LIMIT ? OFFSET ?
    `;

    // Query para obtener el total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM purificadores p
      LEFT JOIN salas s ON p.sala = s.id
      LEFT JOIN hospitales h ON s.hospital = h.id
      ${whereClause}
    `;

    const [rows]: any[] = await executeQuery(dataQuery, [...queryParams, limit, offset]);
    const [countRows]: any[] = await executeQuery(countQuery, queryParams);
    
    const totalCount = countRows[0]?.total || 0;

    return NextResponse.json({
      rows,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener listado de purificadores:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
