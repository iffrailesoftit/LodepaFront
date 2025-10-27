"use client"

import { ConfAlerta, getAlertaConfByUsuario } from "@/actions/alerta/getAlertaConf"
import { useEffect, useState } from "react"
import AlertasActivasList from "./ListaConfAlerta"
import Loading from "@/components/loading/Loading"
import { Hospital } from "@/actions/hospital/getHospital"
import { Salas } from "@/actions/hospital/sala/getSala"

interface AlertasConfProps {
    userId: number;
    hospitales: Hospital[];
    salas: Salas[];
    rol: number;
}

export default function AlertaConf({userId, hospitales, salas, rol }: AlertasConfProps) { 
    const [alertasActivas, setAlertasActivas] = useState<ConfAlerta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const fetchAlertas = async (userId: number,rol: number) => {
        try {
            const data = await getAlertaConfByUsuario(userId, rol)
            setAlertasActivas(data)
        } catch (err) {
            setError("Error al cargar las configuraciones de alertas. Por favor, intenta de nuevo más tarde.")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
    const refreshAlertasWrapper = () => {
        fetchAlertas(userId, rol);
    };
    useEffect(() => {
        fetchAlertas(userId, rol)
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
            <AlertasActivasList userId={userId} alertasActivas={alertasActivas} hospitales={hospitales} salas={salas} refreshAlertas={refreshAlertasWrapper}/>
        </div>
    )
}

