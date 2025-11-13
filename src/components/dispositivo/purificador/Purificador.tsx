"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Power, Clock, Wind, Loader2 } from "lucide-react"

interface PurificadorProps {
    id: string
}

interface Purificador {
    id: string
    estado: number
    id_sala: number
    encendido: number
    tipo_placa: number
    velocidad_ventiladores: number
    fecha_alta: string
    lampara_actual: number
    fecha_actualizacion: string
    estado_actual: number
    estado_maquina: number
}

const Purificador: React.FC<PurificadorProps> = ({ id }) => {
    const [data, setData] = useState<Purificador | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const inFlightRef = useRef<AbortController | null>(null)

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null

        async function loadData() {
            inFlightRef.current?.abort()
            const ac = new AbortController()
            inFlightRef.current = ac

            try {
                setLoading(true)
                const res = await fetch(`/api/purificador/${id}`, {
                    signal: ac.signal,
                    cache: "no-store",
                })
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`)
                const json = (await res.json()) as Purificador
                setData(json)
                setError(null)
            } catch (err: any) {
                if (err?.name !== "AbortError") setError(err?.message ?? "Error desconocido")
            } finally {
                if (!ac.signal.aborted) setLoading(false)
            }
        }

        loadData()
        intervalId = setInterval(loadData, 60_000)

        const onVisibility = () => {
            if (document.hidden) {
                if (intervalId) {
                    clearInterval(intervalId)
                    intervalId = null
                }
            } else {
                loadData()
                intervalId = setInterval(loadData, 60_000)
            }
        }
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            document.removeEventListener("visibilitychange", onVisibility)
            if (intervalId) clearInterval(intervalId)
            inFlightRef.current?.abort()
        }
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Cargando datos del purificador...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-medium">Error: {error}</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600">No se encontraron datos del purificador</p>
            </div>
        )
    }

    const totalMinutos = data.lampara_actual; // viene en MINUTOS
    const lamparaDias = Math.floor(totalMinutos / 1440); // 1 día = 1440 min
    const lamparaHoras = Math.floor((totalMinutos % 1440) / 60); // resto de minutos del día → horas
    const lamparaMinutos = totalMinutos % 60; // resto de minutos finales

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Estado del Purificador</h1>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card: Estado de Encendido */}
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Estado</h3>
                            <div
                                className={`p-3 rounded-full transition-colors ${data.encendido === 1 ? "bg-green-100" : "bg-gray-100"}`}
                            >
                                <Power className={`h-6 w-6 ${data.encendido === 1 ? "text-green-600" : "text-gray-400"}`} />
                            </div>
                        </div>
                        <p className={`text-2xl font-bold ${data.encendido === 1 ? "text-green-600" : "text-gray-500"}`}>
                            {data.encendido === 1 ? "Encendido" : "Apagado"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Estado del purificador</p>
                    </div>

                    {/* Card: Tiempo de Lámpara */}
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Lámpara</h3>
                            <div className="p-3 rounded-full bg-blue-100">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>

                        <p className="text-2xl font-bold text-blue-600">
                            {lamparaDias}d {lamparaHoras}h {lamparaMinutos}m
                        </p>

                        {/* Opcional: muestra también los minutos totales */}
                        <p className="text-sm text-gray-500 mt-1">
                            Tiempo de uso: <span className="font-semibold">{totalMinutos.toLocaleString()}</span> minutos
                        </p>
                    </div>

                    {/* Card: Velocidad de Ventiladores */}
                    <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Ventiladores</h3>
                            <div className="p-3 rounded-full bg-purple-100">
                                <Wind className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>

                        {/* Lógica de texto y color según nivel */}
                        {data.velocidad_ventiladores === 0 ? (
                            <>
                                <p className="text-2xl font-bold text-gray-500">Apagado</p>
                                <p className="text-sm text-gray-500 mt-1">Ventiladores desactivados</p>
                            </>
                        ) : data.velocidad_ventiladores === 255 ? (
                            <>
                                <p className="text-2xl font-bold text-purple-600">Rápido</p>
                                <p className="text-sm text-gray-500 mt-1">Velocidad máxima</p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-purple-500">Lento</p>
                                <p className="text-sm text-gray-500 mt-1">Velocidad baja</p>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Purificador
