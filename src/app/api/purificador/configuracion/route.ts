import { NextResponse } from "next/server";
import { executeQuery, getConnection } from "@/lib/db";
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
  const purificadorId = searchParams.get("purificadorId");

  if (!purificadorId) {
    return NextResponse.json({ message: "Falta el parámetro purificadorId" }, { status: 400 });
  }

  try {
    const [rows]: any[] = await executeQuery(
      `SELECT * FROM configuracion_purificador WHERE purificador = ? ORDER BY orden ASC;`,
      [purificadorId]
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error al obtener configuraciones:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  if (![1, 2, 4].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      purificadorId,
      dias,
      hora_inicio,
      minutos_inicio,
      hora_fin,
      minutos_fin,
      velocidad,
      on,
    } = body;

    // Validación básica
    if (
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

      // Verificar límite de 8 configuraciones
      const [countResult]: any = await conn.query(
        `SELECT COUNT(*) as count FROM configuracion_purificador WHERE purificador = ?`,
        [purificadorId]
      );
      const count = countResult[0].count;

      if (count >= 8) {
        await conn.rollback();
        conn.release();
        return NextResponse.json({ message: "Límite máximo de 8 configuraciones alcanzado" }, { status: 400 });
      }

      // Obtener el siguiente orden
      const [maxResult]: any = await conn.query(
        `SELECT MAX(orden) as maxOrden FROM configuracion_purificador WHERE purificador = ?`,
        [purificadorId]
      );
      const nextOrden = (maxResult[0].maxOrden || 0) + 1;

      // 1. Insertar configuración
      const [insertResult]: any = await conn.query(
        `INSERT INTO configuracion_purificador 
          (purificador, dias, hora_inicio, minutos_inicio, hora_fin, minutos_fin, velocidad, orden, \`on\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purificadorId,
          dias,
          hora_inicio,
          minutos_inicio,
          hora_fin,
          minutos_fin,
          velocidad,
          nextOrden,
          on,
        ]
      );

      // 2. Actualizar fecha en purificadores
      await conn.query(
        `UPDATE purificadores SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
        [purificadorId]
      );

      await conn.commit();
      conn.release();

      return NextResponse.json(
        { message: "Configuración guardada", id: insertResult.insertId },
        { status: 201 }
      );
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error("Error al guardar configuración:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
