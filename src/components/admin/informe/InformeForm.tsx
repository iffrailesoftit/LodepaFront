"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { HospitalSala } from "@/actions/hospital/getListado"
import { Button } from "@/components/ui/button"

interface Sala {
    id_sala: number
    n_sala: string
}

interface Hospital {
    id_hospital: number
    hospital: string
    salas: Sala[]
}

function agruparHospitales(data: HospitalSala[]): Hospital[] {
    const map = new Map<number, Hospital>()

    for (const row of data) {
        if (!map.has(row.id_hospital)) {
            map.set(row.id_hospital, {
                id_hospital: row.id_hospital,
                hospital: row.hospital,
                salas: [],
            })
        }
        map.get(row.id_hospital)!.salas.push({
            id_sala: row.id_sala,
            n_sala: row.n_sala,
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
    selectedSalas: number[]
    setSelectedSalas: React.Dispatch<React.SetStateAction<number[]>>
}) {
    const [open, setOpen] = useState(false)
    const hospitalCheckboxRef = useRef<HTMLInputElement | null>(null)

    const idsSalasHospital = useMemo(() => hospital.salas.map(s => s.id_sala), [hospital.salas])

    const checkedCount = useMemo(() => {
        let count = 0
        for (const id of idsSalasHospital) if (selectedSalas.includes(id)) count++
        return count
    }, [idsSalasHospital, selectedSalas])

    const isChecked = idsSalasHospital.length > 0 && checkedCount === idsSalasHospital.length
    const isIndeterminate = checkedCount > 0 && checkedCount < idsSalasHospital.length

    useEffect(() => {
        if (hospitalCheckboxRef.current) {
            hospitalCheckboxRef.current.indeterminate = isIndeterminate
        }
    }, [isIndeterminate])

    const toggleHospital = () => {
        if (isChecked) {
            // quitar todas las salas del hospital
            setSelectedSalas(prev => prev.filter(id => !idsSalasHospital.includes(id)))
        } else {
            // añadir todas las salas del hospital
            setSelectedSalas(prev => Array.from(new Set([...prev, ...idsSalasHospital])))
            setOpen(true) // opcional: abrir al seleccionar
        }
    }

    const toggleSala = (salaId: number) => {
        setSelectedSalas(prev =>
            prev.includes(salaId) ? prev.filter(id => id !== salaId) : [...prev, salaId]
        )
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
                                checked={selectedSalas.includes(sala.id_sala)}
                                onChange={() => toggleSala(sala.id_sala)}
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
    const [selectedSalas, setSelectedSalas] = useState<number[]>([])

    const allSalaIds = useMemo(() => {
        const ids: number[] = []
        for (const h of hospitales) {
            for (const s of h.salas) {
                ids.push(s.id_sala)
            }
        }
        return ids
    }, [hospitales])

    const isAllSelected = allSalaIds.length > 0 && selectedSalas.length === allSalaIds.length

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedSalas([])
        } else {
            setSelectedSalas(allSalaIds)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={toggleAll}
                    variant="outline"
                >
                    {isAllSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                </Button>
            </div>
            {hospitales.map(hospital => (
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