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

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from "recharts"

import {
  getGraphicsData,
  type ParameterType,
  type TimeRange,
  type GraphicsResponse,
} from "@/actions/dispositivo/graphics"

import { getParameterThresholds, getStatus } from "@/actions/dispositivo/umbrales"

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
const parametersToConvert = ["formaldehyde", "o3", "no2","vocs"]

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
  if (!thresholds) return "#22c55e" // Verde por defecto

  const { min_good, max_good, min_warning, max_warning } = thresholds

  if (value >= min_good && value <= max_good) return "#22c55e" // Verde
  if (value >= min_warning && value <= max_warning) return "#eab308" // Amarillo
  return "#ef4444" // Rojo
}

export function Grafica({ id }: GraficaProps) {
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
      const thresholdData = await getParameterThresholds(parameter,id)
      setThresholds(thresholdData)
    } catch (err) {
      console.error("Error al cargar los umbrales:", err)
    }
  }, [parameter,id])

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
            newValue = newValue * 0.85; // Aplicar reducción del 15%
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
        let  convertedMed = data.med / 1000;

        /*if (parameter === "vocs") {
          convertedMin = convertedMin * 300; // Aplicar reducción del 15%
          convertedMax = convertedMax * 300; // Aplicar reducción del 15%
          convertedMed = convertedMed * 300; // Aplicar reducción del 15%
        }*/
        if (parameter === "formaldehyde") {
          convertedMin = convertedMin * 0.85; // Aplicar reducción del 15%
          convertedMax = convertedMax * 0.85; // Aplicar reducción del 15%
          convertedMed = convertedMed * 0.85; // Aplicar reducción del 15%
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
            const statusColor = await getStatus(parameter, lastValue,id)
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
            const statusColor = await getStatus(parameter, lastValue,id)
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
        <div className="h-[350px] md:h-[400px] w-full my-4">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <p>Cargando datos...</p>
            </div>
          ) : error ? (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : graphData ? (
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
                <AreaChart data={graphData.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatXAxisTime(value, timeRange)}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
  domain={[
    (dataMin: number) => {
      if (displayThresholds) {
        const baseMin =   dataMin;//Math.min(dataMin, displayThresholds.min_warning);
        // Si la diferencia entre dataMin y min_warning es muy grande,
        // podrías ignorar o reducir el peso de min_warning para no "aplastar" los datos.
        // Aquí agregamos un padding mínimo, por ejemplo 0.1,
        // o adaptado a la escala real de tu parámetro:
        //ajustamos a un 10 % por debajo del min, si eso lo hace bajar de cero lo dejamos en cero
        const padding = Math.abs(baseMin) * 0.2;
        
        const valor= baseMin - padding;
        return Math.round(valor * 10000) / 10000;
      }
      return dataMin;
      //return 10;
    },
    (dataMax: number) => {
      if (displayThresholds) {
        const baseMax = dataMax;//Math.max(dataMax, displayThresholds.max_warning);
        // Similar al mínimo, se añade un padding calculado o fijo:
        const padding = Math.abs(baseMax) * 0.2;
        const valor= baseMax + padding;
        return Math.round(valor * 10000) / 10000;
      }
      return dataMax;
      //return 100;
    },
  ]}
/>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />

                  {/* Líneas de referencia para los umbrales */}
                  {displayThresholds && (
                    <>
                      <ReferenceLine
                        y={displayThresholds.min_warning}
                        stroke="#eab308"
                        strokeDasharray="3 3"
                        ifOverflow="extendDomain"
                        label="Min Warning"
                      />
                      <ReferenceLine
                        y={displayThresholds.max_warning}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        ifOverflow="extendDomain"
                        label="Max Warning"
                      />
                    </>
                  )}

                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const value = payload[0].value as number
                        let statusColor = "#22c55e" // Verde por defecto el color de la r

                        // Determinar el color según los umbrales
                        if (displayThresholds) {
                          statusColor = getStatusColor(value, displayThresholds)
                        }

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
                                    : value.toFixed(1)
                                }{" "}
                                {graphData.unit}
                              </div>
                            </div>
                            {displayThresholds && (
                              <div className="mt-1 text-xs">
                                <div className="text-muted-foreground">
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
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={graphData.parameter}
                    unit={graphData.unit}
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : null}
        </div>

        {/* Última actualización */}
        <div className="mt-6 text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleString("es-ES")}
        </div>
      </CardContent>
    </Card>
  )
}

