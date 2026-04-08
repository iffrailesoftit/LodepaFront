import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { verifySession } from "@/actions/auth/getSession";

export async function PUT(
  request: Request,
  context: { params: Promise<{ configId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  const { configId } = await context.params;

  try {
    const body = await request.json();
    const { dias, hora_inicio, minutos_inicio, hora_fin, minutos_fin, velocidad, on, purificadorId } = body;

    if (
      !configId || 
      !purificadorId || 
      !dias || 
      hora_inicio === undefined || 
      minutos_inicio === undefined || 
      hora_fin === undefined || 
      minutos_fin === undefined || 
      velocidad === undefined || 
      on === undefined
    ) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 });
    }

    const conn = await getConnection();

    try {
      await conn.beginTransaction();

      // 1. Actualizar configuración
      await conn.query(
        `UPDATE configuracion_purificador 
         SET dias = ?, hora_inicio = ?, minutos_inicio = ?, hora_fin = ?, minutos_fin = ?, velocidad = ?, \`on\` = ?
         WHERE id = ? AND purificador = ?`,
        [dias, hora_inicio, minutos_inicio, hora_fin, minutos_fin, velocidad, on, configId, purificadorId]
      );

      // 2. Actualizar fecha en purificadores
      await conn.query(
        `UPDATE purificadores SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
        [purificadorId]
      );

      await conn.commit();
      conn.release();

      return NextResponse.json({ message: "Configuración actualizada" }, { status: 200 });
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ configId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  const { configId } = await context.params;
  const { searchParams } = new URL(request.url);
  const purificadorId = searchParams.get("purificadorId");

  if (!configId || !purificadorId) {
    return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 });
  }

  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // 1. Eliminar configuración
    const [result]: any = await conn.query(
      `DELETE FROM configuracion_purificador WHERE id = ? AND purificador = ?`,
      [configId, purificadorId]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return NextResponse.json({ message: "Configuración no encontrada" }, { status: 404 });
    }

    // 2. Actualizar fecha en purificadores
    await conn.query(
      `UPDATE purificadores SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
      [purificadorId]
    );

    // Reordenar las configuraciones restantes para mantener orden del 1 al N (opcional, pero buena práctica si el frontend confía en 'orden')
    const [rows]: any = await conn.query(
      `SELECT id FROM configuracion_purificador WHERE purificador = ? ORDER BY orden ASC`,
      [purificadorId]
    );
    
    for (let i = 0; i < rows.length; i++) {
        await conn.query(
            `UPDATE configuracion_purificador SET orden = ? WHERE id = ?`,
            [i + 1, rows[i].id]
        );
    }

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Configuración eliminada" }, { status: 200 });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Error al eliminar configuración:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
