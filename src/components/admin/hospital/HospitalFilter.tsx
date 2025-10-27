"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface HospitalFilterProps {
    hospitales: any[];
    onFilterChange: (filteredHospitales: any[]) => void;
}

export default function HospitalFilter({ hospitales, onFilterChange }: HospitalFilterProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterField, setFilterField] = useState("hospital");

    // Función para filtrar hospitales
    const handleFilter = (term: string) => {
        const searchTermLower = term.toLowerCase();
        const filteredHospitales = hospitales.filter((hospital) => {
            if (!term.trim()) return true;
            return (
                hospital.id.toString().includes(searchTermLower) ||
                hospital.hospital.toLowerCase().includes(searchTermLower) ||
                hospital.num_salas.toString().includes(searchTermLower)
            );
        });
        onFilterChange(filteredHospitales);
    };


    // Actualiza filtro cuando cambia el término de búsqueda
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTerm = e.target.value;
        setSearchTerm(newTerm);
        handleFilter(newTerm);
    };


    // Actualiza filtro cuando cambia el campo de filtrado
    const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newField = e.target.value;
        setFilterField(newField);
        // Aunque ahora no se utiliza newField en handleFilter,
        // puedes llamar a handleFilter con el término actual:
        handleFilter(searchTerm);
    };


    // Uso de useMemo para calcular el número de hospitales filtrados
    const filteredCount = useMemo(() => {
        return hospitales.filter((hospital) => {
            if (!searchTerm.trim()) return true;
            const searchTermLower = searchTerm.toLowerCase();
            return (
                hospital.id.toString().includes(searchTermLower) ||
                hospital.hospital.toLowerCase().includes(searchTermLower) ||
                hospital.num_salas.toString().includes(searchTermLower)
            );
        }).length;
    }, [hospitales, searchTerm]);

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-64">
                    <select
                        value={filterField}
                        onChange={handleFieldChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="hospital">Todos los campos</option>
                    </select>
                </div>
                <div className="flex-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                        <input
                            type="text"
                            placeholder="Buscar hospitales..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
                Mostrando {filteredCount} de {hospitales.length} hospitales
            </div>
        </div>
    );
}
