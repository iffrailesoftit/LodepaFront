import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  if (![1, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const estado = searchParams.get("estado");
  const offset = (page - 1) * limit;

  try {
    // 1. Obtener conteos por estado para los badges de las pestañas
    const [countsRows]: any[] = await executeQuery(
      `SELECT estado, COUNT(*) as total FROM mantenimiento_averias GROUP BY estado`,
      []
    );

    const counts: any = { PENDIENTE: 0, EN_PROCESO: 0, RESUELTO: 0 };
    countsRows.forEach((row: any) => {
      if (counts.hasOwnProperty(row.estado)) {
        counts[row.estado] = row.total;
      }
    });

    // 2. Construir la consulta con filtro de estado si aplica
    let whereClause = "";
    const queryParams: any[] = [];
    if (estado) {
      whereClause = "WHERE m.estado = ?";
      queryParams.push(estado);
    }

    // 3. Obtener el total de registros para la paginación del estado actual
    const [totalRows]: any[] = await executeQuery(
      `SELECT COUNT(*) as total FROM mantenimiento_averias m ${whereClause}`,
      queryParams
    );
    const totalRecords = totalRows[0].total;

    // 4. Obtener los datos paginados
    const [rows]: any[] = await executeQuery(
      `SELECT
         m.id,
         m.purificador_id,
         m.fecha_reporte,
         m.tipo_incidencia,
         m.descripcion,
         m.estado,
         m.fecha_resolucion,
         m.comentario_resolucion,
         m.usuario_reporta_id,
         m.usuario_id                        AS tecnico_id,
         CONCAT(ur.nombre, ' ', ur.apellido)   AS nombre_reporta,
         CONCAT(ut.nombre, ' ', ut.apellido)   AS nombre_tecnico,
         h.hospital                          AS nombre_hospital,
         s.n_sala                            AS nombre_sala
       FROM mantenimiento_averias m
       INNER JOIN purificadores  p  ON p.id  = m.purificador_id
       LEFT  JOIN salas           s  ON s.id  = p.sala
       LEFT  JOIN hospitales      h  ON h.id  = s.hospital
       LEFT  JOIN usuarios        ur ON ur.id = m.usuario_reporta_id
       LEFT  JOIN usuarios        ut ON ut.id = m.usuario_id
       ${whereClause}
       ORDER BY m.fecha_reporte DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return NextResponse.json({
      data: rows,
      total_records: totalRecords,
      total_pages: Math.ceil(totalRecords / limit),
      counts
    }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener incidencias:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
