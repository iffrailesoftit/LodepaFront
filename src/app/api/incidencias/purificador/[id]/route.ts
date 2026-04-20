import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function GET(
  _request: Request,
  // Next.js 15: los params de rutas dinámicas se reciben como Promise
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  if (![1, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Hay que hacer await de params antes de desestructurar en Next.js 15
  const { id } = await params;

  try {
    const [rows]: any[] = await executeQuery(
      `SELECT 
         m.id,
         m.fecha_reporte,
         m.tipo_incidencia,
         m.descripcion,
         m.estado,
         m.fecha_resolucion,
         CONCAT(ur.nombre, ' ', ur.apellido) AS nombre_reporta,
         CONCAT(ut.nombre, ' ', ut.apellido) AS nombre_tecnico
       FROM mantenimiento_averias m
       LEFT JOIN usuarios ur ON ur.id = m.usuario_reporta_id
       LEFT JOIN usuarios ut ON ut.id = m.usuario_id
       WHERE m.purificador_id = ?
       ORDER BY m.fecha_reporte DESC`,
      [id]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error al obtener historial de purificador:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
