/**
 * Formatea una fecha para la consulta SQL SIEMPRE usando la zona horaria de Madrid (Europe/Madrid).
 * Esto garantiza que la consulta sea coherente sin importar si el servidor está en UTC o en Madrid.
 * La base de datos almacena los registros en hora local de Madrid, por lo que debemos
 * consultarla usando esa misma zona horaria.
 */
export function formatDateForSQL(date: Date): string {
  // Usamos Intl.DateTimeFormat con la zona horaria de Madrid para obtener las partes de la fecha
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const p: Record<string, string> = {}
  parts.forEach((part) => {
    p[part.type] = part.value
  })

  // Retorna formato YYYY-MM-DD HH:mm:ss, que es lo que espera MySQL
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
}

/**
 * Convierte un timestamp que viene de la base de datos (en hora de Madrid) a un
 * string ISO-8601 en UTC. Así el cliente puede interpretarlo correctamente en
 * cualquier zona horaria del navegador.
 *
 * Problema a resolver:
 * - MySQL devuelve strings como "2026-04-17 11:05:00" (hora de Madrid, sin offset).
 * - Si el servidor de Node está en UTC, `new Date("2026-04-17 11:05:00")` lo interpreta
 *   como UTC (11:05 UTC), cuando en realidad es 11:05 Madrid (= 09:05 UTC).
 * - Esto provoca un desfase de zona horaria en la visualización.
 *
 * Solución:
 * - Calculamos el offset de Madrid para ese instante concreto usando Intl.DateTimeFormat.
 * - Restamos ese offset para obtener el UTC real y lo devolvemos como ISO string o Date corregido.
 */
export function parseMySQLDate(timestamp: string | Date | null | undefined): string | null {
  if (!timestamp) return null

  // Si ya es un string ISO con 'Z', no necesita conversión
  if (typeof timestamp === "string" && timestamp.includes("T") && timestamp.includes("Z")) {
    return timestamp
  }

  let rawDate: Date

  if (typeof timestamp === "string") {
    // Convertimos el string de la BD ("YYYY-MM-DD HH:mm:ss") a Date.
    // Sin zona horaria explícita, JS lo interpreta como horario LOCAL del servidor.
    rawDate = new Date(timestamp.replace(" ", "T"))
  } else {
    // El driver mysql2 a veces ya nos da un objeto Date.
    // Si el servidor es UTC, lo habrá interpretado como UTC, que es incorrecto
    // (el valor real es Madrid), así que necesitamos corregirlo igual.
    rawDate = timestamp
  }

  if (isNaN(rawDate.getTime())) return null

  // Obtenemos qué hora marca Madrid para ese instante según el sistema
  const madridStr = rawDate.toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  const madridDate = new Date(madridStr)

  // La diferencia entre cómo leyó el servidor y lo que Madrid marca nos da el offset a corregir
  const offsetMs = madridDate.getTime() - rawDate.getTime()

  // Restamos el offset: el resultado es el instante UTC real correspondiente a la hora de Madrid
  return new Date(rawDate.getTime() - offsetMs).toISOString()
}
