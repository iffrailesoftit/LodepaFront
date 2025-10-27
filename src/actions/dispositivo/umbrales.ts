"use server"
import  { executeQuery } from "@/lib/db";

export async function getStatus(parametro: string, value: number,id_sala:string): Promise<string> {
  
  const query = `
    SELECT u.min_good,
            u.max_good,
            COALESCE(ua.min_warning, u.min_warning)   AS min_warning,
            COALESCE(ua.max_warning, u.max_warning)   AS max_warning
            FROM umbrales_alertas ua
            INNER JOIN umbrales u ON ua.id_parametro = u.rowid
            INNER JOIN configuracion_alertas ca ON ua.id_conf_alerta = ca.id
            WHERE ca.sala_id = ?
    AND parametro = ?
    LIMIT 1;
  `;
  let [rows]: any = await executeQuery(query, [id_sala,parametro]);

   if (!rows || rows.length === 0) {
    const query2 = `
    SELECT u.min_good,
            u.max_good,
            u.min_warning,
            u.max_warning
            FROM umbrales u
            WHERE parametro = ?
    LIMIT 1;
  `
    const [rows2]: any = await executeQuery(query2, [parametro])
    rows = rows2;
  }

  if (!rows || rows.length === 0) {
    return '#22c55e';
  }

  const { min_good, max_good, min_warning, max_warning } = rows[0];

  if (value >= min_good && value <= max_good) return '#22c55e';
  if (value >= min_warning && value <= max_warning) return '#eab308';
  return '#ef4444';
}


export async function getMeasurementRanges(id_sala:number): Promise<Record<string, any>> {
  const query = `
    SELECT
            u.parametro,
            u.min_good,
            u.max_good,
            COALESCE(ua.min_warning, u.min_warning)   AS min_warning,
            COALESCE(ua.max_warning, u.max_warning)   AS max_warning
            FROM umbrales_alertas ua
            INNER JOIN umbrales u ON ua.id_parametro = u.rowid
            INNER JOIN configuracion_alertas ca ON ua.id_conf_alerta = ca.id
            WHERE ca.sala_id = ?;
  `;
  let [rows]: any = await executeQuery(query, [id_sala]);

  if (!rows || rows.length === 0) {
    const query2 = `
    SELECT 
            u.parametro,
            u.min_good,
            u.max_good,
            u.min_warning,
            u.max_warning
            FROM umbrales u
            ;
  `
    const [rows2]: any = await executeQuery(query2)
    rows = rows2;
  }

  // Transforma los resultados en el objeto con la estructura deseada
  const measurementRanges = rows.reduce((acc: any, row: any) => {
    acc[row.parametro.toLowerCase()] = {
      good: { min: row.min_good, max: row.max_good },
      warning: { min: row.min_warning, max: row.max_warning },
    };
    return acc;
  }, {});

  return measurementRanges;
}

// Nueva función para obtener los umbrales específicos de un parámetro
export async function getParameterThresholds(parametro: string,id:string): Promise<{
  min_good: number
  max_good: number
  min_warning: number
  max_warning: number
} | null> {
  const query = `
    SELECT u.min_good,
            u.max_good,
            COALESCE(ua.min_warning, u.min_warning)   AS min_warning,
            COALESCE(ua.max_warning, u.max_warning)   AS max_warning
            FROM umbrales_alertas ua
            INNER JOIN umbrales u ON ua.id_parametro = u.rowid
            INNER JOIN configuracion_alertas ca ON ua.id_conf_alerta = ca.id
            WHERE ca.sala_id = ?
    AND parametro = ?
    LIMIT 1;
  `
  const [rows]: any = await executeQuery(query, [id,parametro])

  if (!rows || rows.length === 0) {
    const query2 = `
    SELECT u.min_good,
            u.max_good,
            u.min_warning,
            u.max_warning
            FROM umbrales u
            WHERE parametro = ?
    LIMIT 1;
  `
    const [rows2]: any = await executeQuery(query2, [parametro])
    if (!rows2 || rows2.length === 0) {
      return null
    }
    return rows2[0]
  }
  return rows[0]
}
// Nueva acción del servidor para obtener colores para múltiples parámetros
export async function getStatusBatch(
  parametros: Array<{ parametro: string; valor: number }>,
  id_sala:string,
): Promise<Record<string, string>> {
  const resultados: Record<string, string> = {}
   console.log(id_sala)
  await Promise.all(
    parametros.map(async ({ parametro, valor }) => {
      resultados[parametro] = await getStatus(parametro, valor, id_sala)
    }),
  )

  return resultados
}
