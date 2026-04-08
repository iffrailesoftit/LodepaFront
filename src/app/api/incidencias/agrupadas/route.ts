import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function GET(_request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  // Protección de rutas: Solo Admin (1) y Técnico (4)
  if (![1, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const [rows]: any[] = await executeQuery(
      `SELECT 
          p.id AS purificador_id, 
          h.hospital AS hospital, 
          s.n_sala AS sala, 
          COUNT(m.id) AS total_incidencias,
          SUM(CASE WHEN m.estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS total_pendientes,
          SUM(CASE WHEN m.estado = 'EN_PROCESO' THEN 1 ELSE 0 END) AS total_en_proceso,
          SUM(CASE WHEN m.estado = 'RESUELTO' THEN 1 ELSE 0 END) AS total_resueltas
      FROM purificadores p
      JOIN mantenimiento_averias m ON p.id = m.purificador_id
      LEFT JOIN salas s ON p.sala = s.id
      LEFT JOIN hospitales h ON s.hospital = h.id
      GROUP BY p.id, h.hospital, s.n_sala
      ORDER BY total_incidencias DESC;`
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error al obtener incidencias agrupadas:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
