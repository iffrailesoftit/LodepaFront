"use server"

import  { executeQuery } from "@/lib/db"

// Definición de tipos para los parámetros y respuesta
export type ParameterType =
  | "temperature"
  | "humidity"
  | "co2"
  | "formaldehyde"
  | "vocs"
  | "pm1"
  | "pm25"
  | "pm4"
  | "pm10"
  | "co"
  | "o3"
  | "no2"
  | "iaq"
  | "thermal_indicator"
  | "ventilation_indicator"
  | "covid19"

export type TimeRange = "24h" | "1w" | "2w" | "1m"

export type DataPoint = {
  timestamp: string
  value: number
}

export type GraphicsResponse = {
  data: DataPoint[]
  min: number
  max: number
  med: number
  parameter: string
  unit: string
  startDate: string
  endDate: string
}

// Tipo para los resultados de la consulta
type QueryResultRow = {
  update_time: string | Date
  [key: string]: any // Permite propiedades dinámicas para los parámetros
}

// Función para obtener las unidades según el parámetro
const getUnitByParameter = (parameter: ParameterType): string => {
  const units: Record<ParameterType, string> = {
    temperature: "°C",
    humidity: "%",
    co2: "ppm",
    formaldehyde: "ppb",
    vocs: "INDEX",
    pm1: "μg/m³",
    pm25: "μg/m³",
    pm4: "μg/m³",
    pm10: "μg/m³",
    co: "ppm",
    o3: "ppb",
    no2: "ppb",
    iaq: "",
    thermal_indicator: "",
    ventilation_indicator: "",
    covid19: "",
  }
  return units[parameter]
}

// Función para obtener el nombre formateado del parámetro
const getParameterName = (parameter: ParameterType): string => {
  const names: Record<ParameterType, string> = {
    temperature: "Temperatura",
    humidity: "Humedad",
    co2: "CO₂",
    formaldehyde: "Formaldehído",
    vocs: "TVOC",
    pm1: "PM1.0",
    pm25: "PM2.5",
    pm4: "PM4.0",
    pm10: "PM10",
    co: "CO",
    o3: "O₃",
    no2: "NO₂",
    iaq: "IAQ",
    thermal_indicator: "Indicador Térmico",
    ventilation_indicator: "Indicador de Ventilación",
    covid19: "COVID-19",
  }
  return names[parameter]
}

// Función para calcular la fecha de inicio según el rango de tiempo
const getStartDateByTimeRange = (endDate: Date, timeRange: TimeRange): Date => {
  const startDate = new Date(endDate)

  switch (timeRange) {
    case "24h":
      startDate.setDate(startDate.getDate() - 1)
      break
    case "1w":
      startDate.setDate(startDate.getDate() - 7)
      break
    case "2w":
      startDate.setDate(startDate.getDate() - 14)
      break
    case "1m":
      startDate.setMonth(startDate.getMonth() - 1)
      break
  }

  return startDate
}

// Función para formatear fecha para SQL
function formatDateForSQL(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Función principal para obtener los datos de la gráfica
export async function getGraphicsData(
  deviceId: string,
  parameter: ParameterType,
  timeRange: TimeRange,
  customStartDate?: string,
  customEndDate?: string,
): Promise<GraphicsResponse> {
  try {
    // Determinar fechas de inicio y fin
    const endDate = customEndDate ? new Date(customEndDate) : new Date()
    const startDate = customStartDate ? new Date(customStartDate) : getStartDateByTimeRange(endDate, timeRange)

    // Formatear fechas para la consulta SQL
    const startDateStr = formatDateForSQL(startDate)
    const endDateStr = formatDateForSQL(endDate)

    console.log("Consultando datos con los siguientes parámetros:")
    console.log("Dispositivo:", deviceId)
    console.log("Parámetro:", parameter)
    console.log("Fecha inicio:", startDateStr)
    console.log("Fecha fin:", endDateStr)
    console.log("Usando fechas personalizadas:", !!customStartDate && !!customEndDate)

    // Consulta a la base de datos utilizando la estructura de la tabla "registros"
    const result = await executeQuery(
      `
      SELECT 
        update_time, 
        ${parameter}
      FROM 
        registros
      WHERE 
        dispositivo = ?
        AND update_time BETWEEN ? AND ?
      ORDER BY 
        update_time ASC
    `,
      [deviceId, startDateStr, endDateStr],
    )

    console.log("Estructura del resultado:", typeof result)

    // Procesar los resultados
    const dataPoints: DataPoint[] = []

    // Verificar si result es un array
    if (Array.isArray(result)) {
      console.log("Resultado es un array con", result.length, "elementos")

      // Verificar si el primer elemento es un array (estructura específica de mysql2)
      if (result.length > 0 && Array.isArray(result[0])) {
        console.log("El primer elemento es un array con", result[0].length, "filas")

        // Procesar el primer elemento como el array de filas
        const rows = result[0] as QueryResultRow[]

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]

          if (row && typeof row === "object" && "update_time" in row && parameter in row) {
            const timestamp = row.update_time
            const value = row[parameter]

            // Solo mostrar logs para la primera y última fila, y cada 20 filas
            if (i === 0 || i === rows.length - 1 || i % 20 === 0) {
              console.log(`Procesando fila ${i}/${rows.length}:`, { timestamp, value })
            }

            if (timestamp && value !== undefined) {
              try {
                // Convertir el valor a número
                const numValue = Number.parseFloat(value)

                // Asegurarse de que el timestamp sea un string ISO
                let isoTimestamp: string

                if (typeof timestamp === "string") {
                  // Si ya es un string ISO, usarlo directamente
                  if (timestamp.includes("T") && timestamp.includes("Z")) {
                    isoTimestamp = timestamp
                  } else {
                    // Convertir string de fecha a formato ISO
                    isoTimestamp = new Date(timestamp).toISOString()
                  }
                } else if (timestamp instanceof Date) {
                  isoTimestamp = timestamp.toISOString()
                } else {
                  console.warn(`Tipo de timestamp no reconocido en fila ${i}:`, typeof timestamp)
                  continue // Saltar esta fila
                }

                dataPoints.push({
                  timestamp: isoTimestamp,
                  value: numValue,
                })
              } catch (err) {
                console.error(`Error al procesar fila ${i}:`, err)
              }
            } else {
              console.warn(`Fila ${i} con valores incompletos:`, { timestamp, value })
            }
          } else {
            console.warn(`Fila ${i} con estructura inesperada:`, row)
          }
        }
      } else {
        // Intentar procesar el resultado directamente como un array de filas
        for (let i = 0; i < result.length; i++) {
          const row = result[i] as unknown as QueryResultRow

          // Verificar si es un objeto con las propiedades esperadas
          if (row && typeof row === "object" && "update_time" in row && parameter in row) {
            const timestamp = row.update_time
            const value = row[parameter]

            // Solo mostrar logs para la primera y última fila, y cada 20 filas
            if (i === 0 || i === result.length - 1 || i % 20 === 0) {
              console.log(`Procesando fila ${i}/${result.length}:`, { timestamp, value })
            }

            if (timestamp && value !== undefined) {
              try {
                // Convertir el valor a número
                const numValue = Number.parseFloat(value)

                // Asegurarse de que el timestamp sea un string ISO
                let isoTimestamp: string

                if (typeof timestamp === "string") {
                  // Si ya es un string ISO, usarlo directamente
                  if (timestamp.includes("T") && timestamp.includes("Z")) {
                    isoTimestamp = timestamp
                  } else {
                    // Convertir string de fecha a formato ISO
                    isoTimestamp = new Date(timestamp).toISOString()
                  }
                } else if (timestamp instanceof Date) {
                  isoTimestamp = timestamp.toISOString()
                } else {
                  console.warn(`Tipo de timestamp no reconocido en fila ${i}:`, typeof timestamp)
                  continue // Saltar esta fila
                }

                dataPoints.push({
                  timestamp: isoTimestamp,
                  value: numValue,
                })
              } catch (err) {
                console.error(`Error al procesar fila ${i}:`, err)
              }
            } else {
              console.warn(`Fila ${i} con valores incompletos:`, { timestamp, value })
            }
          } else {
            // Verificar si es un array (podría ser el primer elemento que contiene las filas)
            if (Array.isArray(row)) {
              console.log(`El elemento ${i} es un array con ${row.length} elementos, intentando procesar...`)

              for (let j = 0; j < row.length; j++) {
                const subRow = row[j] as QueryResultRow

                if (subRow && typeof subRow === "object" && "update_time" in subRow && parameter in subRow) {
                  const timestamp = subRow.update_time
                  const value = subRow[parameter]

                  // Solo mostrar logs para la primera y última fila, y cada 20 filas
                  if (j === 0 || j === row.length - 1 || j % 20 === 0) {
                    console.log(`Procesando subfila ${j}/${row.length}:`, { timestamp, value })
                  }

                  if (timestamp && value !== undefined) {
                    try {
                      // Convertir el valor a número
                      const numValue = Number.parseFloat(value)

                      // Asegurarse de que el timestamp sea un string ISO
                      let isoTimestamp: string

                      if (typeof timestamp === "string") {
                        // Si ya es un string ISO, usarlo directamente
                        if (timestamp.includes("T") && timestamp.includes("Z")) {
                          isoTimestamp = timestamp
                        } else {
                          // Convertir string de fecha a formato ISO
                          isoTimestamp = new Date(timestamp).toISOString()
                        }
                      } else if (timestamp instanceof Date) {
                        isoTimestamp = timestamp.toISOString()
                      } else {
                        console.warn(`Tipo de timestamp no reconocido en subfila ${j}:`, typeof timestamp)
                        continue // Saltar esta fila
                      }

                      dataPoints.push({
                        timestamp: isoTimestamp,
                        value: numValue,
                      })
                    } catch (err) {
                      console.error(`Error al procesar subfila ${j}:`, err)
                    }
                  } else {
                    console.warn(`Subfila ${j} con valores incompletos:`, { timestamp, value })
                  }
                } else {
                  console.warn(`Subfila ${j} con estructura inesperada:`, subRow)
                }
              }
            } else {
              console.warn(`Fila ${i} con estructura inesperada:`, row)
            }
          }
        }
      }
    } else if (result && typeof result === "object") {
      // Si result no es un array pero es un objeto, podría ser un solo resultado
      console.log("Resultado es un objeto, intentando procesar como una sola fila")

      const row = result as unknown as QueryResultRow

      if ("update_time" in row && parameter in row) {
        const timestamp = row.update_time
        const value = row[parameter]

        console.log("Procesando fila única:", { timestamp, value })

        if (timestamp && value !== undefined) {
          try {
            // Convertir el valor a número
            const numValue = Number.parseFloat(value)

            // Asegurarse de que el timestamp sea un string ISO
            let isoTimestamp: string

            if (typeof timestamp === "string") {
              // Si ya es un string ISO, usarlo directamente
              if (timestamp.includes("T") && timestamp.includes("Z")) {
                isoTimestamp = timestamp
              } else {
                // Convertir string de fecha a formato ISO
                isoTimestamp = new Date(timestamp).toISOString()
              }
            } else if (timestamp instanceof Date) {
              isoTimestamp = timestamp.toISOString()
            } else {
              console.warn("Tipo de timestamp no reconocido:", typeof timestamp)
              throw new Error("Formato de timestamp no válido")
            }

            dataPoints.push({
              timestamp: isoTimestamp,
              value: numValue,
            })
          } catch (err) {
            console.error("Error al procesar fila única:", err)
          }
        } else {
          console.warn("Fila única con valores incompletos:", { timestamp, value })
        }
      } else {
        console.warn("Fila única con estructura inesperada:", row)
      }
    } else {
      console.error("Estructura de resultado no reconocida:", result)
    }

    console.log(`Total de puntos de datos procesados: ${dataPoints.length}`)

    // Si no hay datos, devolver un error
    if (dataPoints.length === 0) {
      throw new Error("No se encontraron datos para los parámetros especificados")
    }

    // Calcular valores estadísticos
    const values = dataPoints.map((point) => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const med = values.reduce((sum, val) => sum + val, 0) / values.length

    return {
      data: dataPoints,
      min: Number.parseFloat(min.toFixed(1)),
      max: Number.parseFloat(max.toFixed(1)),
      med: Number.parseFloat(med.toFixed(1)),
      parameter: getParameterName(parameter),
      unit: getUnitByParameter(parameter),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  } catch (error) {
    console.error("Error al obtener datos de la gráfica:", error)
    throw new Error("No se pudieron obtener los datos de la gráfica: " + (error as Error).message)
  }
}

