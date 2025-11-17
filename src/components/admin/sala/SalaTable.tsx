"use client"

import type { SalasDispositivos } from "@/actions/hospital/sala/getSala"
import EditarSala from "./modal/EditarSala"
import SalaDispositivosFilter from "./SalaFilter"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import CambiarEstadoDip from "./modal/CambiarEstadoDip"
import AltaSalaModal from "./modal/AltaSalaModal"
import BajaSalaModal from "./modal/BajaSalaModal"
import SalaRow from "./SalaRow"
import { Hospital } from "@/actions/hospital/getHospital"

interface SalaProps {
    sala: SalasDispositivos[]
    hospital: Hospital
}

export default function SalaTable({ sala, hospital }: SalaProps) {
    const [filteredSalas, setFilteredSalas] = useState(sala)
    const [isMobile, setIsMobile] = useState(false)
    // Paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const totalPages = Math.ceil(filteredSalas.length / itemsPerPage)

    // Salas para la página actual
    const currentSalas = filteredSalas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // *Observa* cuando cambian las props "hospitales" y actualiza el estado:
    useEffect(() => {
        setFilteredSalas(sala);
    }, [sala]);

    // Detectar si es dispositivo móvil
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768)
            // Ajustar elementos por página según el tamaño de pantalla
            setItemsPerPage(window.innerWidth < 1024 ? 5 : 10)
        }

        checkIfMobile()
        window.addEventListener("resize", checkIfMobile)

        return () => {
            window.removeEventListener("resize", checkIfMobile)
        }
    }, [])

    // Cambiar de página
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    // Manejar cambio de filtro
    const handleFilterChange = (filtered: SalasDispositivos[]) => {
        setFilteredSalas(filtered)
        setCurrentPage(1) // Resetear a primera página cuando cambia el filtro
    }

    return (
        <div className="space-y-4">
            <SalaDispositivosFilter salas={sala} onFilterChange={handleFilterChange} />

            {/* Mensaje cuando no hay resultados */}
            {filteredSalas.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
                    No se encontraron dispositivos para esta sala.
                </div>
            )}

            {/* Vista móvil: Tarjetas en lugar de tabla */}
            {isMobile && filteredSalas.length > 0 && (
                <div className="space-y-4 md:hidden">
                    {currentSalas.map((s: SalasDispositivos) => {
                        const updateDate = new Date(s.ultimaActualizacion)
                        const now = new Date()
                        const diffMinutes = (now.getTime() - updateDate.getTime()) / (1000 * 60)

                        return (
                            <div key={s.id_sala} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-900">{s.n_sala}</h3>
                                    <span className=" px-2 py-1 rounded-full text-xs font-medium">
                                        <CambiarEstadoDip sala={s} />
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="font-medium">S/N:</span>{" "}
                                        <span className="truncate block max-w-[250px]"> {s.n_dispositivo}</span>
                                    </p>
                                    <p>
                                        <span className="font-medium">Referencia:</span>{" "}
                                        <span className="truncate block max-w-[250px]"> {s.referencia}</span>
                                    </p>
                                    <p>
                                        <span className="font-medium">API Key:</span>{" "}
                                        <span className="truncate block max-w-[250px]">{s.api_key_inbiot}</span>
                                    </p>
                                    <p>
                                        <span className="font-medium">Última Actualización:</span>{" "}
                                        <span className={diffMinutes > 75 ? "text-red-500" : "text-gray-800"}>
                                            {updateDate.toLocaleString()}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-medium">Fecha Baja:</span>{" "}
                                        <span className={s.fecha_baja ? "text-red-500" : "text-gray-800"}>
                                            {s.fecha_baja ? s.fecha_baja.toLocaleString("es-ES") : "Activo"}
                                        </span>
                                    </p>
                                </div>

                                <div className="mt-4 flex space-x-2">
                                    <EditarSala sala={s} hospital={hospital} />
                                    {!s.fecha_baja ? (
                                        <BajaSalaModal sala={s} hospital={hospital} />
                                    ) : (
                                        <AltaSalaModal sala={s} hospital={hospital} />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Vista desktop: Tabla tradicional */}
            <div className={`overflow-x-auto rounded-lg shadow ${isMobile ? "hidden" : "block"}`}>
                <table className="min-w-full bg-white border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Sala</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">S/N</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Referencia</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">API Key</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Ultima Actualización
                            </th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Baja</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Activo</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {currentSalas.map((s: SalasDispositivos) => {
                            return (
                                <SalaRow key={s.id_sala} sala={s} hospital={hospital} />
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {filteredSalas.length > 0 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${currentPage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${currentPage === totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            Siguiente
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredSalas.length)}</span> de{" "}
                                <span className="font-medium">{filteredSalas.length}</span> resultados
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${currentPage === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    <span className="sr-only">Anterior</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>

                                {/* Números de página */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Lógica para mostrar páginas alrededor de la página actual
                                    let pageNum
                                    if (totalPages <= 5) {
                                        pageNum = i + 1
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                    } else {
                                        pageNum = currentPage - 2 + i
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${currentPage === pageNum ? "bg-blue-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${currentPage === totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    <span className="sr-only">Siguiente</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

