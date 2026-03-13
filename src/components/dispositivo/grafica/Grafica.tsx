"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CalendarIcon, Pause } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

import { Line, LineChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Customized } from "recharts"

import {
  getGraphicsData,
  type ParameterType,
  type TimeRange,
  type GraphicsResponse,
} from "@/actions/dispositivo/graphics"

import { getParameterThresholds, getStatus } from "@/actions/dispositivo/umbrales"

function SegmentedLine({
  points,
  thresholds,
  strokeWidth = 2,
}: {
  points?: Array<any>
  thresholds: ParameterThresholds
  strokeWidth?: number
}) {
  if (!points || !thresholds || points.length < 2) return null

  const segments: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    color: string
    key: string
  }> = []

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]

    if (
      a?.value == null ||
      b?.value == null ||
      a?.x == null ||
      a?.y == null ||
      b?.x == null ||
      b?.y == null
    ) {
      continue
    }

    const start = { value: Number(a.value), timestamp: String(a.payload.timestamp) }
    const end = { value: Number(b.value), timestamp: String(b.payload.timestamp) }

    if (Number.isNaN(start.value) || Number.isNaN(end.value)) continue

    const crossings = getThresholdCrossings(start.value, end.value, thresholds)

    const pieces = [start]

    for (const threshold of crossings) {
      pieces.push(interpolateCrossing(start, end, threshold))
    }

    pieces.push(end)

    for (let j = 0; j < pieces.length - 1; j++) {
      const p1 = pieces[j]
      const p2 = pieces[j + 1]

      const ratio1 =
        start.value === end.value ? 0 : (p1.value - start.value) / (end.value - start.value)
      const ratio2 =
        start.value === end.value ? 1 : (p2.value - start.value) / (end.value - start.value)

      const x1 = a.x + (b.x - a.x) * ratio1
      const y1 = a.y + (b.y - a.y) * ratio1
      const x2 = a.x + (b.x - a.x) * ratio2
      const y2 = a.y + (b.y - a.y) * ratio2

      const midValue = (p1.value + p2.value) / 2
      const band = getBandFromValue(midValue, thresholds)

      segments.push({
        x1,
        y1,
        x2,
        y2,
        color: getStrokeFromBand(band),
        key: `${i}-${j}`,
      })
    }
  }

  return (
    <g>
      {segments.map((s) => (
        <line
          key={s.key}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={s.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </g>
  )
}
// Opciones para el selector de parámetros
const parameterOptions = [
  { value: "temperature", label: "Temperatura (°C)" },
  { value: "humidity", label: "Humedad (%)" },
  { value: "co2", label: "CO₂ (ppm)" },
  { value: "formaldehyde", label: "Formaldehído (ppm)" }, // Cambiado de ppb a ppm
  { value: "vocs", label: "TVOC (ppm)" },
  { value: "pm1", label: "PM1.0 (μg/m³)" },
  { value: "pm25", label: "PM2.5 (μg/m³)" },
  { value: "pm4", label: "PM4.0 (μg/m³)" },
  { value: "pm10", label: "PM10 (μg/m³)" },
  { value: "co", label: "CO (ppm)" },
  { value: "o3", label: "O₃ (ppm)" }, // Cambiado de ppb a ppm
  { value: "no2", label: "NO₂ (ppm)" }, // Cambiado de ppb a ppm
  { value: "iaq", label: "IAQ" },
  { value: "thermal_indicator", label: "Indicador Térmico" },
  { value: "ventilation_indicator", label: "Indicador de Ventilación" },
  { value: "covid19", label: "COVID-19" },
]

// Parámetros que necesitan conversión de ppb a ppm (dividir por 1000)
const parametersToConvert = ["formaldehyde", "o3", "no2", "vocs"]

// Opciones para el selector de rango de tiempo
const timeRangeOptions = [
  { value: "24h", label: "24 horas" },
  { value: "1w", label: "1 semana" },
  { value: "2w", label: "2 semanas" },
  { value: "1m", label: "1 mes" },
]

// Tipo para los umbrales específicos de un parámetro
type ParameterThresholds = {
  min_good: number
  max_good: number
  min_warning: number
  max_warning: number
} | null

interface GraficaProps {
  id: string // Recibe el id del dispositivo desde el submenu
}

// Función para formatear fecha y hora
function formatDateTime(dateString: string): string {
  const date = new Date(dateString)

  // Formatear día con dos dígitos
  const day = date.getDate().toString().padStart(2, "0")
  // Formatear mes con dos dígitos (getMonth() devuelve 0-11)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  // Obtener año
  const year = date.getFullYear()
  // Formatear hora con dos dígitos
  const hours = date.getHours().toString().padStart(2, "0")
  // Formatear minutos con dos dígitos
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

// Función para formatear hora para el eje X
function formatXAxisTime(dateString: string, timeRange: TimeRange): string {
  const date = new Date(dateString)
  if (timeRange === "24h") {
    // Solo mostrar hora y minutos para rango de 24 horas
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  } else {
    // Mostrar día, mes y hora para rangos más largos
    const day = date.getDate().toString().padStart(2, "0")
    // Nombres de meses en español
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const month = monthNames[date.getMonth()]
    // const hours = date.getHours().toString().padStart(2, "0")
    // const minutes = date.getMinutes().toString().padStart(2, "0")
    //devolvemos soy dia y mes para no sobrecargar el grafico
    return `${day} ${month}`
    //return `${day} ${month} ${hours}:${minutes}`
  }
}

// Función para formatear hora para input de tiempo
function formatTimeInput(date: Date | undefined): string {
  if (!date) return ""

  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${hours}:${minutes}`
}

// Función para calcular fechas basadas en el rango de tiempo
function calculateDateRange(timeRange: TimeRange): { startDate: Date; endDate: Date } {
  const endDate = new Date() // Fecha actual
  const startDate = new Date(endDate) // Clonar la fecha actual

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

  return { startDate, endDate }
}

// Función para obtener el color de estado según el valor y los umbrales
function getStatusColor(value: number, thresholds: ParameterThresholds): string {
  if (!thresholds) return "#22c55e"

  const { min_good, max_good, min_warning, max_warning } = thresholds
  if (value >= min_good && value <= max_good) return "#22c55e"
  if (value >= min_warning && value <= max_warning) return "#eab308"
  return "#ef4444"
}

type SegmentedPoint = {
  timestamp: string
  value: number
  greenValue: number | null
  yellowValue: number | null
  redValue: number | null
}

type BandColor = "green" | "yellow" | "red"

function getBandFromValue(
  value: number,
  thresholds: ParameterThresholds
): BandColor {
  if (!thresholds) return "green"

  const { min_good, max_good, min_warning, max_warning } = thresholds

  if (value >= min_good && value <= max_good) return "green"
  if (value >= min_warning && value <= max_warning) return "yellow"
  return "red"
}

function getStrokeFromBand(band: BandColor) {
  if (band === "green") return "#10b981"
  if (band === "yellow") return "#eab308"
  return "#ef4444"
}

function interpolateCrossing(
  p1: { value: number; timestamp: string },
  p2: { value: number; timestamp: string },
  targetValue: number
) {
  const t1 = new Date(p1.timestamp).getTime()
  const t2 = new Date(p2.timestamp).getTime()

  if (p1.value === p2.value) {
    return {
      timestamp: p1.timestamp,
      value: targetValue,
    }
  }

  const ratio = (targetValue - p1.value) / (p2.value - p1.value)

  return {
    timestamp: new Date(t1 + (t2 - t1) * ratio).toISOString(),
    value: targetValue,
  }
}

function getThresholdCrossings(
  v1: number,
  v2: number,
  thresholds: ParameterThresholds
) {
  if (!thresholds) return []

  const all = [
    thresholds.min_warning,
    thresholds.min_good,
    thresholds.max_good,
    thresholds.max_warning,
  ].filter((v, i, arr) => arr.indexOf(v) === i)

  const min = Math.min(v1, v2)
  const max = Math.max(v1, v2)

  return all
    .filter((t) => t > min && t < max)
    .sort((a, b) => (v2 >= v1 ? a - b : b - a))
}

function buildPoint(
  timestamp: string,
  value: number,
  band: "green" | "yellow" | "red"
): SegmentedPoint {
  return {
    timestamp,
    value,
    greenValue: band === "green" ? value : null,
    yellowValue: band === "yellow" ? value : null,
    redValue: band === "red" ? value : null,
  }
}

function interpolatePoint(
  p1: { timestamp: string; value: number },
  p2: { timestamp: string; value: number },
  targetValue: number
) {
  const t1 = new Date(p1.timestamp).getTime()
  const t2 = new Date(p2.timestamp).getTime()

  if (p2.value === p1.value) {
    return {
      timestamp: p1.timestamp,
      value: targetValue,
    }
  }

  const ratio = (targetValue - p1.value) / (p2.value - p1.value)
  const interpolatedTime = new Date(t1 + (t2 - t1) * ratio).toISOString()

  return {
    timestamp: interpolatedTime,
    value: targetValue,
  }
}

function getCrossedThresholds(
  v1: number,
  v2: number,
  thresholds: ParameterThresholds
): number[] {
  if (!thresholds) return []

  const candidates = [
    thresholds.min_warning,
    thresholds.min_good,
    thresholds.max_good,
    thresholds.max_warning,
  ].filter((v, i, arr) => arr.indexOf(v) === i)

  const min = Math.min(v1, v2)
  const max = Math.max(v1, v2)

  return candidates
    .filter((t) => t > min && t < max)
    .sort((a, b) => (v2 >= v1 ? a - b : b - a))
}

function buildSegmentedChartDataContinuous(
  data: Array<{ timestamp: string; value: number }>,
  thresholds: ParameterThresholds
): SegmentedPoint[] {
  if (!thresholds || data.length === 0) return []

  const result: SegmentedPoint[] = []

  for (let i = 0; i < data.length - 1; i++) {
    const start = data[i]
    const end = data[i + 1]

    const crossed = getCrossedThresholds(start.value, end.value, thresholds)

    let currentPoint = start
    let currentBand = getBandFromValue(currentPoint.value, thresholds)

    if (i === 0) {
      result.push(buildPoint(currentPoint.timestamp, currentPoint.value, currentBand))
    }

    for (const threshold of crossed) {
      const crossPoint = interpolatePoint(currentPoint, end, threshold)

      result.push(buildPoint(crossPoint.timestamp, crossPoint.value, currentBand))

      currentBand = getBandFromValue(
        threshold + (end.value > start.value ? 0.000001 : -0.000001),
        thresholds
      )

      const shiftedTimestamp = new Date(
        new Date(crossPoint.timestamp).getTime() + 1
      ).toISOString()

      result.push(buildPoint(shiftedTimestamp, crossPoint.value, currentBand))

      currentPoint = crossPoint
    }

    const endBand = getBandFromValue(end.value, thresholds)
    result.push(buildPoint(end.timestamp, end.value, endBand))
  }

  return result
}

export function Grafica({ id }: GraficaProps) {

  const chartRef = useRef<HTMLDivElement>(null)

  async function exportChartToPNG() {
    if (!chartRef.current) return null

    const svg = chartRef.current.querySelector("svg")
    if (!svg) return null

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    })

    const url = URL.createObjectURL(blob)
    const img = new Image()

    return new Promise<string>((resolve) => {
      img.onload = () => {
        const scale = 3 // 🔥 más grande = más calidad en PDF

        const canvas = document.createElement("canvas")
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve("")

        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        ctx.drawImage(img, 0, 0)

        URL.revokeObjectURL(url)

        resolve(canvas.toDataURL("image/png"))
      }

      img.src = url
    })
  }

  // Estados para los selectores y fechas
  const [parameter, setParameter] = useState<ParameterType>("temperature")
  const [timeRange, setTimeRange] = useState<TimeRange>("24h")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [useCustomDates, setUseCustomDates] = useState(false)

  // Estado para los datos de la gráfica
  const [graphData, setGraphData] = useState<GraphicsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para los umbrales
  const [thresholds, setThresholds] = useState<ParameterThresholds>(null)
  const [currentValueStatus, setCurrentValueStatus] = useState<string>("#22c55e") // Color verde por defecto

  // Inicializar fechas al cargar el componente
  useEffect(() => {
    const { startDate: calculatedStartDate, endDate: calculatedEndDate } = calculateDateRange(timeRange)
    setStartDate(calculatedStartDate)
    setEndDate(calculatedEndDate)
  }, [timeRange])

  // Envolvemos loadThresholds en useCallback para mantener su referencia estable
  const loadThresholds = useCallback(async () => {
    try {
      const thresholdData = await getParameterThresholds(parameter, id)
      if (parameter === "iaq" || parameter === "thermal_indicator" || parameter === "ventilation_indicator" || parameter === "covid19") {
        setThresholds({
          min_good: 65,
          max_good: 100000,
          min_warning: 36,
          max_warning: 100000,
        })
      } else {
        setThresholds(thresholdData)
      }
    } catch (err) {
      console.error("Error al cargar los umbrales:", err)
    }
  }, [parameter, id])

  // Cargar los umbrales cuando cambia el parámetro
  useEffect(() => {
    loadThresholds()
  }, [loadThresholds])



  // Actualizar fechas cuando cambia el rango de tiempo (solo si no se están usando fechas personalizadas)
  useEffect(() => {
    if (!useCustomDates) {
      const { startDate: calculatedStartDate, endDate: calculatedEndDate } = calculateDateRange(timeRange)
      setStartDate(calculatedStartDate)
      setEndDate(calculatedEndDate)
    }
  }, [timeRange, useCustomDates])

  // Función para cargar datos
  const loadData = useCallback(async () => {
    if (!id || !startDate || !endDate) return

    try {
      setLoading(true)
      setError(null)

      // Si estamos usando fechas personalizadas, pasarlas a la función
      // Si no, pasar null para que la función use el rango de tiempo
      const customStartDate = useCustomDates ? startDate.toISOString() : undefined
      const customEndDate = useCustomDates ? endDate.toISOString() : undefined

      const data = await getGraphicsData(id, parameter, timeRange, customStartDate, customEndDate)

      // Convertir valores de ppb a ppm para formaldehído, O₃ y NO₂
      if (parametersToConvert.includes(parameter)) {
        // Convertir los valores de los datos
        const convertedData = data.data.map((point) => {
          let newValue = point.value / 1000; // Conversión básica ppb -> ppm

          /*if (parameter === "vocs") {
            newValue = newValue * 300; // Aplicar reducción del 15%
          }*/
          if (parameter === "formaldehyde") {
            newValue = newValue; // Aplicar reducción del 15%
          }

          // Limitar a 3 decimales
          newValue = parseFloat(newValue.toFixed(3));

          return {
            ...point,
            value: newValue,
          };
        });

        // Actualizar los valores estadísticos
        let convertedMin = data.min / 1000;
        let convertedMax = data.max / 1000;
        let convertedMed = data.med / 1000;

        /*if (parameter === "vocs") {
          convertedMin = convertedMin * 300; // Aplicar reducción del 15%
          convertedMax = convertedMax * 300; // Aplicar reducción del 15%
          convertedMed = convertedMed * 300; // Aplicar reducción del 15%
        }*/
        if (parameter === "formaldehyde") {
          convertedMin = convertedMin; // Aplicar reducción del 15%
          convertedMax = convertedMax; // Aplicar reducción del 15%
          convertedMed = convertedMed; // Aplicar reducción del 15%
        }
        // Si es formaldehído, reducir un 15% adicional


        // Actualizar la unidad a ppm
        const updatedData = {
          ...data,
          data: convertedData,
          min: Number(convertedMin.toFixed(3)),
          max: Number(convertedMax.toFixed(3)),
          med: Number(convertedMed.toFixed(3)),
          unit: "ppm", // Cambiar la unidad de ppb a ppm
        }

        setGraphData(updatedData)

        // Obtener el estado del valor actual (último valor)
        if (convertedData.length > 0) {
          const lastValue = convertedData[convertedData.length - 1].value
          if (thresholds) {
            const statusColor = getStatusColor(lastValue, thresholds)
            setCurrentValueStatus(statusColor)
          } else {
            // Si no hay umbrales, usar la función del servidor
            const statusColor = await getStatus(parameter, lastValue, id)
            setCurrentValueStatus(statusColor)
          }
        }
      } else {
        setGraphData(data)

        // Obtener el estado del valor actual (último valor)
        if (data.data.length > 0) {
          const lastValue = data.data[data.data.length - 1].value
          if (thresholds) {
            const statusColor = getStatusColor(lastValue, thresholds)
            setCurrentValueStatus(statusColor)
          } else {
            // Si no hay umbrales, usar la función del servidor
            const statusColor = await getStatus(parameter, lastValue, id)
            setCurrentValueStatus(statusColor)
          }
        }
      }

      // Si no estamos usando fechas personalizadas, actualizar las fechas con las de la respuesta
      if (!useCustomDates) {
        const newStartDate = new Date(data.startDate)
        const newEndDate = new Date(data.endDate)

        const shouldUpdateStart = !startDate || Math.abs(newStartDate.getTime() - startDate.getTime()) > 60000
        const shouldUpdateEnd = !endDate || Math.abs(newEndDate.getTime() - endDate.getTime()) > 60000

        if (shouldUpdateStart) {
          setStartDate(newStartDate)
        }
        if (shouldUpdateEnd) {
          setEndDate(newEndDate)
        }
      }
    } catch (err) {
      setError("Error al cargar los datos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id, parameter, timeRange, startDate, endDate, useCustomDates, thresholds])

  const loadDataRef = useRef(loadData)

  // Actualizar la referencia cuando cambie loadData
  useEffect(() => {
    loadDataRef.current = loadData
  }, [loadData])

  // Efecto para cargar datos cuando cambian los parámetros relevantes
  // pero sin depender de loadData directamente
  useEffect(() => {
    if (id) {
      // Usar un pequeño retraso para evitar múltiples cargas rápidas
      const timer = setTimeout(() => {
        loadDataRef.current()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [id, parameter, timeRange])

  // Función para manejar cambios en el selector de rango de tiempo
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange)
    setUseCustomDates(false) // Desactivar fechas personalizadas al cambiar el rango
  }

  // Función para manejar cambios en las fechas personalizadas
  const handleDateChange = (date: Date | undefined, isStartDate: boolean) => {
    if (date) {
      if (isStartDate) {
        setStartDate(date)
      } else {
        setEndDate(date)
      }
      setUseCustomDates(true) // Activar fechas personalizadas al cambiar manualmente
    }
  }

  // Función para aplicar fechas personalizadas
  const applyCustomDates = () => {
    if (startDate && endDate) {
      setUseCustomDates(true)
      loadData()
    }
  }

  // Usar los umbrales directamente sin conversión
  const displayThresholds = thresholds

  const segmentedData =
    graphData && displayThresholds
      ? buildSegmentedChartDataContinuous(graphData.data, displayThresholds)
      : []

  return (
    <Card className="w-full max-w-[1000px] mx-auto h-full overflow-hidden">
      <CardContent className="p-4 md:p-6 space-y-4 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Selector de parámetros */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Parámetros</label>
            <Select value={parameter} onValueChange={(value) => setParameter(value as ParameterType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar parámetro" />
              </SelectTrigger>
              <SelectContent>
                {parameterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de rango de tiempo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rango de tiempo</label>
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rango" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones adicionales */}
          <div className="flex items-end justify-end gap-2">
            {useCustomDates && (
              <Button variant="outline" onClick={applyCustomDates}>
                Aplicar fechas
              </Button>
            )}
            <Button variant="outline" size="icon" className="ml-auto">
              <Pause className="h-4 w-4" />
              <span className="sr-only">Pausar</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Selector de fecha de inicio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de inicio</label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? formatDateTime(startDate.toISOString()) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      // Mantener la hora actual si ya existe una fecha
                      if (startDate) {
                        date.setHours(startDate.getHours(), startDate.getMinutes())
                      }
                      handleDateChange(date, true)
                    }
                    setStartDateOpen(false)
                  }}
                />
                <div className="p-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formatTimeInput(startDate)}
                      onChange={(e) => {
                        if (startDate && e.target.value) {
                          const [hours, minutes] = e.target.value.split(":")
                          const newDate = new Date(startDate)
                          newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
                          handleDateChange(newDate, true)
                        }
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selector de fecha final */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha final</label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? formatDateTime(endDate.toISOString()) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      // Mantener la hora actual si ya existe una fecha
                      if (endDate) {
                        date.setHours(endDate.getHours(), endDate.getMinutes())
                      }
                      handleDateChange(date, false)
                    }
                    setEndDateOpen(false)
                  }}
                />
                <div className="p-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formatTimeInput(endDate)}
                      onChange={(e) => {
                        if (endDate && e.target.value) {
                          const [hours, minutes] = e.target.value.split(":")
                          const newDate = new Date(endDate)
                          newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
                          handleDateChange(newDate, false)
                        }
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Indicador de modo de fecha */}
        <div className="mb-6 text-sm">
          <span className={`${useCustomDates ? "text-amber-600" : "text-green-600"} font-medium`}>
            {useCustomDates
              ? "Usando fechas personalizadas"
              : `Usando rango de tiempo: ${timeRangeOptions.find((o) => o.value === timeRange)?.label}`}
          </span>
        </div>

        {/* Indicadores de valores , incluimos también el warnign max y el danger max*/}
        {graphData && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              med. {graphData.med}
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              min. {graphData.min}
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              max. {graphData.max}
            </div>
            <div className="bg-yellow-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              warning: {thresholds?.max_good}
            </div>
            <div className="bg-red-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              danger {thresholds?.max_warning}
            </div>
            {/* Indicador de estado actual */}
            <div
              className="px-4 py-2 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: currentValueStatus }}
            >
              Estado actual
            </div>
          </div>
        )}

        {/* Gráfica */}
        <div ref={chartRef} className="h-[350px] md:h-[400px] w-full my-4">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <p>Cargando datos...</p>
            </div>
          ) : error ? (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : graphData && displayThresholds ? (
            <ChartContainer
              config={{
                value: {
                  label: graphData.parameter,
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={segmentedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatXAxisTime(value, timeRange)}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    minTickGap={20}
                  />

                  <YAxis
                    domain={[
                      (dataMin: number) => {
                        if (!Number.isFinite(dataMin)) return 0
                        const padding = Math.abs(dataMin || 1) * 0.15
                        let minVal = Number((dataMin - padding).toFixed(4))
                        if (["o3", "no2", "co", "iaq", "thermal_indicator", "ventilation_indicator", "covid19"].includes(parameter) && minVal < 0) {
                          minVal = 0
                        }
                        return minVal
                      },
                      (dataMax: number) => {
                        if (!Number.isFinite(dataMax)) return 100
                        const padding = Math.abs(dataMax || 1) * 0.15
                        return Number((dataMax + padding).toFixed(4))
                      },
                    ]}
                    tick={{ fontSize: 12 }}
                  />

                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null

                      const validPayload = payload.find((item) => item.value != null)
                      if (!validPayload) return null

                      const rawValue = validPayload.value
                      const value = typeof rawValue === "number" ? rawValue : Number(rawValue)

                      if (Number.isNaN(value)) return null
                      const statusColor = displayThresholds
                        ? getStatusColor(value, displayThresholds)
                        : "#22c55e"

                      return (
                        <div className="bg-background border rounded-md shadow-sm px-3 py-2 text-sm">
                          <div className="font-medium">{formatDateTime(label)}</div>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                              <span className="text-muted-foreground">{graphData.parameter}</span>
                            </div>

                            <div className="font-medium">
                              {parameter === "vocs"
                                ? value.toFixed(1)
                                : parametersToConvert.includes(parameter)
                                  ? value.toFixed(3)
                                  : value.toFixed(1)}{" "}
                              {graphData.unit}
                            </div>
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            Estado:
                            <span className="ml-1 font-medium" style={{ color: statusColor }}>
                              {statusColor === "#22c55e"
                                ? "Bueno"
                                : statusColor === "#eab308"
                                  ? "Advertencia"
                                  : "Peligro"}
                            </span>
                          </div>
                        </div>
                      )
                    }}
                  />

                  <Line
                    type="linear"
                    dataKey="value"
                    stroke="transparent"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{ r: 3 }}
                  />

                  <Customized
                    component={(props: any) => (
                      <SegmentedLine
                        points={props?.formattedGraphicalItems?.[0]?.props?.points}
                        thresholds={displayThresholds}
                        strokeWidth={1.8}
                      />
                    )}
                  />

                  {displayThresholds.min_warning <= displayThresholds.min_good && (
                    <ReferenceLine
                      y={displayThresholds.min_good}
                      stroke="#eab308"
                      strokeWidth={1.2}
                      ifOverflow="extendDomain"
                      isFront={true}
                    />
                  )}

                  <ReferenceLine
                    y={displayThresholds.max_good}
                    stroke="#eab308"
                    strokeWidth={1.2}
                    ifOverflow="extendDomain"
                    isFront={true}
                  />

                  {displayThresholds.min_warning <= displayThresholds.min_good && (
                    <ReferenceLine
                      y={displayThresholds.min_warning}
                      stroke="#ef4444"
                      strokeWidth={1.2}
                      ifOverflow="extendDomain"
                      isFront={true}
                    />
                  )}

                  <ReferenceLine
                    y={displayThresholds.max_warning}
                    stroke="#ef4444"
                    strokeWidth={1.2}
                    ifOverflow="extendDomain"
                    isFront={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : null}
        </div>

        <Button
          className="mt-4"
          onClick={async () => {
            const image = await exportChartToPNG()
            if (!image) return

            const link = document.createElement("a")
            link.href = image
            link.download = `grafica-${parameter}.png`
            link.click()
          }}
        >
          Descargar PNG
        </Button>

        {/* Última actualización */}
        <div className="mt-6 text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleString("es-ES")}
        </div>
      </CardContent>
    </Card>
  )
}

