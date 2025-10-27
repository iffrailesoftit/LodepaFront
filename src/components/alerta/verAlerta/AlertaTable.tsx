"use client"

import { useEffect, useState } from "react"
import AlertaList from "./AlertaList"
import { Alerta, getAlertaByUsuario } from "@/actions/alerta/getAlerta"
import Loading from "@/components/loading/Loading"
import { Hospital } from "@/actions/hospital/getHospital"
import { Salas } from "@/actions/hospital/sala/getSala"


interface AlertasTableProps {
    userId: number;
    hospitales: Hospital[];
    salas: Salas[];
    rol: number;
}

export default function AlertaTable({ userId, hospitales, salas , rol}: AlertasTableProps) {
    const [alertas, setAlertas] = useState<Alerta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAlertas = async () => {
            try {
                
                const data = await getAlertaByUsuario(userId,rol)
                setAlertas(data)
            } catch (err) {
                setError("Error al cargar las alertas. Por favor, intenta de nuevo más tarde.")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchAlertas()
    }, [userId, rol])

    if (loading) {
        return (
            <Loading />
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">{error}</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <AlertaList alertas={alertas} hospitales={hospitales} salas={salas} />
        </div>
    )
}

