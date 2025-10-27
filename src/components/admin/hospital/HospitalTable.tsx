"use client"

import Link from "next/link";
import EditarHospital from "./modals/EditarHospital";
import { useState, useEffect } from "react";
import HospitalFilter from "./HospitalFilter";
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HospitalTable({ hospitales }: any) {
    const [filteredHospitales, setFilteredHospitales] = useState(hospitales);
    const [isMobile, setIsMobile] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const totalPages = Math.ceil(filteredHospitales.length / itemsPerPage);

    // Hospitales para la página actual
    const currentHospitales = filteredHospitales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    // *Observa* cuando cambian las props "hospitales" y actualiza el estado:
    useEffect(() => {
        setFilteredHospitales(hospitales);
    }, [hospitales]);

    // Detectar si es dispositivo móvil
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
            // Ajustar elementos por página según el tamaño de pantalla
            setItemsPerPage(window.innerWidth < 1024 ? 5 : 10);
        };

        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);

        return () => {
            window.removeEventListener("resize", checkIfMobile);
        };
    }, []);

    // Cambiar de página
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    // Manejar cambio de filtro
    const handleFilterChange = (filtered: any[]) => {
        setFilteredHospitales(filtered);
        setCurrentPage(1); // Resetear a primera página cuando cambia el filtro
    };


    return (
        <div className="space-y-4">
            <HospitalFilter hospitales={hospitales} onFilterChange={handleFilterChange} />

            {/* Mensaje cuando no hay resultados */}
            {filteredHospitales.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
                    No se encontraron hospitales con los criterios de búsqueda.
                </div>
            )}

            {/* Vista móvil: Tarjetas en lugar de tabla */}
            {isMobile && filteredHospitales.length > 0 && (
                <div className="space-y-4 md:hidden">
                    {currentHospitales.map((hospital: any) => (
                        <div key={hospital.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-900">
                                    <Link href={`/dashboard/admin/hospital/${hospital.id}/salas`} className="text-blue-600 hover:underline">
                                        {hospital.hospital}
                                    </Link>
                                </h3>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                    ID: {hospital.id}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="font-medium">Número de Salas:</span> {hospital.num_salas}
                                </p>
                            </div>

                            <div className="mt-4 flex space-x-2">
                                <EditarHospital hospital={hospital} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vista desktop: Tabla tradicional */}
            <div className={`overflow-x-auto rounded-lg shadow ${isMobile ? "hidden" : "block"}`}>
                <table className="min-w-full bg-white border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Numero de Salas</th>
                            <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {currentHospitales.map((hospital: any) => (
                            <tr key={hospital.id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2 text-sm">{hospital.id}</td>
                                <td className="border px-4 py-2 text-sm">
                                    <Link href={`/dashboard/admin/hospital/${hospital.id}/salas`} className="text-blue-600 hover:underline">
                                        {hospital.hospital}
                                    </Link>
                                </td>
                                <td className="border px-4 py-2 text-sm">{hospital.num_salas}</td>
                                <td className="border px-4 py-2 text-sm">
                                    <EditarHospital hospital={hospital} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {filteredHospitales.length > 0 && (
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
                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredHospitales.length)}</span> de{" "}
                                <span className="font-medium">{filteredHospitales.length}</span> resultados
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
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
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
                                    );
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
    );
}
