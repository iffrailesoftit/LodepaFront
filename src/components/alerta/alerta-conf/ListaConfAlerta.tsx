"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Bell, Clock, Home, MapPin, Search, User } from "lucide-react"
import { ConfAlerta } from "@/actions/alerta/getAlertaConf"
import NuevaAlerta from "./formulario-modal/NuevaAlerta"
import { Hospital } from "@/actions/hospital/getHospital"
import { Salas } from "@/actions/hospital/sala/getSala"
import EliminarAlerta from "./formulario-modal/EliminarAlerta"

interface AlertasActivasListProps {
    alertasActivas: ConfAlerta[];
    hospitales: Hospital[];
    salas: Salas[];
    userId: number;
    refreshAlertas: () => void;  // Nueva prop para refrescar alertas
}

export default function AlertasActivasList({ alertasActivas, userId, hospitales, salas ,refreshAlertas}: AlertasActivasListProps) {
    const [filteredAlertas, setFilteredAlertas] = useState<ConfAlerta[]>(alertasActivas)
    useEffect(() => {
        setFilteredAlertas(alertasActivas);
    }, [alertasActivas]);
    const [isMobile, setIsMobile] = useState(false)
    const nuevaAlerta: any = {
        id: 0,
        sala_id: 0,
        n_sala: "",
        hospital_id: 0,
        hospital: "",
        usuario_id: 0,
        usuario_nombre: "",
        hora_min: 0,
        hora_max: 0,
    }

    const [selectSala, setSelectSala] = useState<Salas[]>([])
    // Estado para filtros
    const [filtroHospital, setFiltroHospital] = useState<number | null>(null)
    const [filtroSala, setFiltroSala] = useState<number | null>(null)
    const [busqueda, setBusqueda] = useState("")

    // Paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const totalPages = Math.ceil(filteredAlertas.length / itemsPerPage)

    // Alertas para la página actual
    const currentAlertas = filteredAlertas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    
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

    // Aplicar filtros
    useEffect(() => {
        let resultado = [...alertasActivas]

        // Filtrar por hospital
        if (filtroHospital) {
            resultado = resultado.filter((alerta) => alerta.hospital_id === filtroHospital)
            setSelectSala(salas.filter((sala) => sala.hospital === filtroHospital))
        }else{
            setSelectSala(salas)
        }

        // Filtrar por sala
        if (filtroSala) {
            resultado = resultado.filter((alerta) => alerta.sala_id === filtroSala)
        }

        // Filtrar por búsqueda
        if (busqueda.trim()) {
            const terminoBusqueda = busqueda.toLowerCase()
            resultado = resultado.filter(
                (alerta) =>
                    alerta.n_sala.toLowerCase().includes(terminoBusqueda) ||
                    alerta.hospital.toLowerCase().includes(terminoBusqueda),
            )
        }

        setFilteredAlertas(resultado)
        setCurrentPage(1) // Resetear a primera página cuando cambian los filtros
    }, [alertasActivas,salas ,filtroHospital, filtroSala, busqueda])

    // Resetear el filtro de sala cuando cambia el hospital
    useEffect(() => {
        setFiltroSala(null)
    }, [filtroHospital])

    // Cambiar de página
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    return (
        <div className="space-y-4">

            {/* Contenedor principal con borde redondeado */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                {/* Encabezado con título y botón de añadir */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-gray-800">Alertas Configuradas</h2>
                    <NuevaAlerta confAlerta={nuevaAlerta} id_usuario={userId} hospitales={hospitales} salas={salas} refreshAlertas={refreshAlertas}
                    />
                </div>

                {/* Filtros desplegables */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Filtro por hospital */}
                    <select
                        value={filtroHospital || ""}
                        onChange={(e) => setFiltroHospital(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Todos los hospitales</option>
                        {hospitales.map((hospital) => (
                            <option key={hospital.id} value={hospital.id}>
                                {hospital.hospital}
                            </option>
                        ))}
                    </select>

                    {/* Filtro por sala */}
                    <select
                        value={filtroSala || ""}
                        onChange={(e) => setFiltroSala(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Todas las salas</option>
                        {selectSala.map((sala) => (
                            <option key={sala.id} value={sala.id}>
                                {sala.n_sala}
                            </option>
                        ))}
                    </select>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar configuración"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Mensaje cuando no hay resultados */}
                {filteredAlertas.length === 0 && (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">No hay alertas configuradas</h3>
                        <p className="text-gray-500">No hay alertas encontradas.</p>
                    </div>
                )}

                {/* Vista móvil: Tarjetas */}
                {isMobile && filteredAlertas.length > 0 && (
                    <div className="space-y-4">
                        {currentAlertas.map((alerta) => (
                            <div key={alerta.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                        <Bell className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                                        <h3 className="font-medium text-gray-900">{alerta.n_sala}</h3>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="flex items-center text-gray-600">
                                        <Home className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                        {alerta.hospital}
                                    </p>

                                    <p className="flex items-center text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                        {alerta.n_sala}
                                    </p>
                                    <p className="flex items-center text-gray-600">
                                        <User className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                        {alerta.usuario_nombre} {alerta.usuario_apellido}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="flex items-center text-gray-700">
                                            <Clock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                            <span className="font-medium">Horario:&nbsp;</span>{(alerta.hora_min)} -{" "}
                                            {(alerta.hora_max)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex space-x-2">
                                    <NuevaAlerta confAlerta={alerta} id_usuario={userId} hospitales={hospitales} salas={salas} refreshAlertas={refreshAlertas}/>
                                    <EliminarAlerta alertaId={alerta.id} refreshAlertas={refreshAlertas}/>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Vista desktop: Tabla */}
                {!isMobile && filteredAlertas.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-gray-50 text-gray-700">
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Hospital</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Sala</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Hora Mínima</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Hora Máxima</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentAlertas.map((alerta) => (
                                    <tr key={alerta.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-700">{alerta.hospital}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{alerta.n_sala}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{alerta.usuario_nombre} {alerta.usuario_apellido}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{(alerta.hora_min)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{(alerta.hora_max)}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex space-x-2">
                                                <NuevaAlerta confAlerta={alerta} id_usuario={userId} hospitales={hospitales} salas={salas} refreshAlertas={refreshAlertas}/>
                                                <EliminarAlerta alertaId={alerta.id} refreshAlertas={refreshAlertas}/>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {filteredAlertas.length > 0 && (
                    <div className="flex items-center justify-between mt-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${currentPage === 1
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                    }`}
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`relative ml-3 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${currentPage === totalPages
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                    }`}
                            >
                                Siguiente
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAlertas.length)}</span> de{" "}
                                    <span className="font-medium">{filteredAlertas.length}</span> resultados
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center rounded-l-full px-3 py-2 ${currentPage === 1
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
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
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${currentPage === pageNum
                                                    ? "z-10 bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-gray-500 hover:bg-gray-50 border-gray-200"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}

                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center rounded-r-full px-3 py-2 ${currentPage === totalPages
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
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
        </div>
    )
}

