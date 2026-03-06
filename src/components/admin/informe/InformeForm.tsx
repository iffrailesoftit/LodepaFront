"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { HospitalSala } from "@/actions/hospital/getListado"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { type ParameterType } from "@/actions/dispositivo/graphics"

const allParameters: ParameterType[] = [
    "temperature",
    "humidity",
    "co2",
    "formaldehyde",
    "vocs",
    "pm1",
    "pm25",
    "pm4",
    "pm10",
    "co",
    "o3",
    "no2",
    "iaq",
]

interface Sala {
    id_sala: number
    n_sala: string
    id_dispositivo: number
    n_dispositivo: string
}

interface Hospital {
    id_hospital: number
    hospital: string
    logo: string
    salas: Sala[]
}

function agruparHospitales(data: HospitalSala[]): Hospital[] {
    const map = new Map<number, Hospital>()

    for (const row of data) {
        if (!map.has(row.id_hospital)) {
            map.set(row.id_hospital, {
                id_hospital: row.id_hospital,
                hospital: row.hospital,
                logo: row.logo,
                salas: [],
            })
        }
        map.get(row.id_hospital)!.salas.push({
            id_sala: row.id_sala,
            n_sala: row.n_sala,
            id_dispositivo: row.id_dispositivo,
            n_dispositivo: row.n_dispositivo,
        })
    }

    return Array.from(map.values())
}

function HospitalItem({
    hospital,
    selectedSalas,
    setSelectedSalas,
}: {
    hospital: Hospital
    selectedSalas: Hospital[]
    setSelectedSalas: React.Dispatch<React.SetStateAction<Hospital[]>>
}) {
    const [open, setOpen] = useState(false)
    const hospitalCheckboxRef = useRef<HTMLInputElement | null>(null)

    const idsSalasHospital = useMemo(() => hospital.salas.map(s => s.id_sala), [hospital.salas])

    const checkedCount = useMemo(() => {
        const hospitalInSelected = selectedSalas.find(h => h.id_hospital === hospital.id_hospital)
        if (!hospitalInSelected) return 0
        return hospitalInSelected.salas.length
    }, [hospital, selectedSalas])

    const isChecked = idsSalasHospital.length > 0 && checkedCount === idsSalasHospital.length
    const isIndeterminate = checkedCount > 0 && checkedCount < idsSalasHospital.length

    useEffect(() => {
        if (hospitalCheckboxRef.current) {
            hospitalCheckboxRef.current.indeterminate = isIndeterminate
        }
    }, [isIndeterminate])

    const toggleHospital = () => {
        if (isChecked) {
            // quitar el hospital de la lista
            setSelectedSalas(prev => prev.filter(h => h.id_hospital !== hospital.id_hospital))
        } else {
            // añadir el hospital con todas sus salas
            setSelectedSalas(prev => {
                const results = prev.filter(h => h.id_hospital !== hospital.id_hospital)
                return [...results, hospital]
            })
            setOpen(true)
        }
    }

    const toggleSala = (sala: Sala) => {
        setSelectedSalas(prev => {
            const hospitalInSelected = prev.find(h => h.id_hospital === hospital.id_hospital)

            if (!hospitalInSelected) {
                // Si el hospital no estaba, lo añadimos con esta sala
                return [...prev, { ...hospital, salas: [sala] }]
            }

            const isSalaChecked = hospitalInSelected.salas.some(s => s.id_sala === sala.id_sala)

            if (isSalaChecked) {
                // Quitar la sala
                const updatedSalas = hospitalInSelected.salas.filter(s => s.id_sala !== sala.id_sala)
                if (updatedSalas.length === 0) {
                    // Si no quedan salas, quitamos el hospital
                    return prev.filter(h => h.id_hospital !== hospital.id_hospital)
                }
                return prev.map(h => h.id_hospital === hospital.id_hospital ? { ...h, salas: updatedSalas } : h)
            } else {
                // Añadir la sala
                return prev.map(h => h.id_hospital === hospital.id_hospital ? { ...h, salas: [...h.salas, sala] } : h)
            }
        })
    }

    return (
        <div className="border p-4 rounded-lg">
            <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">
                    <input
                        ref={hospitalCheckboxRef}
                        type="checkbox"
                        checked={isChecked}
                        onChange={toggleHospital}
                    />
                    <span className="font-semibold">{hospital.hospital}</span>
                    <span className="text-sm opacity-70">
                        ({checkedCount}/{idsSalasHospital.length})
                    </span>
                </label>

                <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => setOpen(o => !o)}
                    aria-expanded={open}
                >
                    {open ? "Ocultar salas" : "Mostrar salas"}
                </button>
            </div>

            {open && (
                <div className="ml-6 mt-3 space-y-1">
                    {hospital.salas.map(sala => (
                        <label key={sala.id_sala} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!selectedSalas.find(h => h.id_hospital === hospital.id_hospital)?.salas.some(s => s.id_sala === sala.id_sala)}
                                onChange={() => toggleSala(sala)}
                            />
                            <span>{sala.n_sala}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function InformeForm({ data }: { data: HospitalSala[] }) {
    const hospitales = useMemo(() => agruparHospitales(data ?? []), [data])
    const [selectedSalas, setSelectedSalas] = useState<Hospital[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)

    // Fechas por defecto: último mes
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date()
        d.setMonth(d.getMonth() - 1)
        return d
    })
    const [endDate, setEndDate] = useState<Date>(new Date())

    const filteredHospitales = useMemo(() => {
        if (!searchTerm.trim()) return hospitales

        const term = searchTerm.toLowerCase()
        return hospitales.map(h => {
            const hospitalMatches = h.hospital.toLowerCase().includes(term)
            const filteredSalas = h.salas.filter(s =>
                s.n_sala.toLowerCase().includes(term) ||
                s.n_dispositivo.toLowerCase().includes(term)
            )

            if (hospitalMatches) {
                // Si el hospital coincide, mostramos todas sus salas (o podrías decidir filtrar solo las salas que coincidan también)
                return h
            }

            if (filteredSalas.length > 0) {
                // Si hay salas que coinciden, mostramos el hospital con esas salas
                return { ...h, salas: filteredSalas }
            }

            return null
        }).filter((h): h is Hospital => h !== null)
    }, [hospitales, searchTerm])

    const allSalaIds = useMemo(() => {
        const ids: number[] = []
        for (const h of filteredHospitales) {
            for (const s of h.salas) {
                ids.push(s.id_sala)
            }
        }
        return ids
    }, [filteredHospitales])

    const totalSelectedSalas = useMemo(() => {
        return selectedSalas.reduce((acc, h) => acc + h.salas.length, 0)
    }, [selectedSalas])

    const isAllSelected = allSalaIds.length > 0 && totalSelectedSalas === allSalaIds.length

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedSalas([])
        } else {
            // Cuando hay filtro activo, tal vez solo queramos seleccionar lo filtrado
            // O podemos dejar que seleccione todo el dataset completo. 
            // Implementaremos que seleccione lo que está actualmente visible (filteredHospitales)
            setSelectedSalas(prev => {
                // Combinar lo que ya estaba con lo nuevo filtrado, evitando duplicados
                const newSelected = [...prev]
                for (const hFiltered of filteredHospitales) {
                    const existingIndex = newSelected.findIndex(h => h.id_hospital === hFiltered.id_hospital)
                    if (existingIndex > -1) {
                        // Reemplazar con la versión filtrada (o añadir las salas faltantes)
                        // Para este caso, simplificamos: el hospital seleccionado tendrá TODAS las salas visibles filtradas
                        newSelected[existingIndex] = hFiltered
                    } else {
                        newSelected.push(hFiltered)
                    }
                }
                return newSelected
            })
        }
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar hospital o sala..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha de inicio</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={"w-full md:w-[200px] justify-start text-left font-normal bg-background"}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => date && setStartDate(date)}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha final</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={"w-full md:w-[200px] justify-start text-left font-normal bg-background"}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => date && setEndDate(date)}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" onClick={toggleAll} variant="outline">
                        {isAllSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                    </Button>

                    <Button
                        type="button"
                        disabled={totalSelectedSalas === 0 || isGenerating}
                        onClick={async () => {
                            try {
                                setIsGenerating(true)
                                const res = await fetch("/api/informe/pdf", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        selectedSalas,
                                        parameters: allParameters,
                                        customStartDate: startDate.toISOString().split('T')[0],
                                        customEndDate: endDate.toISOString().split('T')[0],
                                    }),
                                })

                                if (!res.ok) {
                                    const errorData = await res.json()
                                    console.error("Error al generar PDF:", errorData.error)
                                    alert("Error al generar el informe: " + (errorData.error || "Error desconocido"))
                                    return
                                }

                                const contentType = res.headers.get("Content-Type")
                                const extension = contentType === "application/zip" ? "zip" : "pdf"
                                const blob = await res.blob()
                                const url = URL.createObjectURL(blob)

                                const a = document.createElement("a")
                                a.href = url
                                a.download = `informes-lodepa-${new Date().toISOString().split('T')[0]}.${extension}`
                                document.body.appendChild(a)
                                a.click()
                                a.remove()

                                URL.revokeObjectURL(url)
                            } catch (error) {
                                console.error("Error en la descarga:", error)
                                alert("Error inesperado al descargar el informe.")
                            } finally {
                                setIsGenerating(false)
                            }
                        }}
                    >
                        {isGenerating ? "Generando..." : `Descargar PDF (${totalSelectedSalas} salas)`}
                    </Button>
                </div>
            </div>
            {filteredHospitales.map(hospital => (
                <HospitalItem
                    key={hospital.id_hospital}
                    hospital={hospital}
                    selectedSalas={selectedSalas}
                    setSelectedSalas={setSelectedSalas}
                />
            ))}
        </div>
    )
}