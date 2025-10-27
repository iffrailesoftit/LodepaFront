"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { SalasDispositivos } from "@/actions/hospital/sala/getSala";

interface SalaDispositivosFilterProps {
    salas: SalasDispositivos[];
    onFilterChange: (filteredSalas: SalasDispositivos[]) => void;
}

export default function SalaDispositivosFilter({ salas, onFilterChange }: SalaDispositivosFilterProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterField, setFilterField] = useState("todos");

    // Función compartida para filtrar
    const filterSalas = (salas: any[], term: string, field: string) => {
        if (!term.trim()) return salas;
        const searchTermLower = term.toLowerCase();
        return salas.filter((sala) => {
            switch (field) {
                case "sala":
                    return sala.n_sala.toLowerCase().includes(searchTermLower);
                case "referencia":
                    return sala.referencia.toLowerCase().includes(searchTermLower);
                case "actualizacion":
                    const updateDate = new Date(sala.ultimaActualizacion);
                    return updateDate.toLocaleString().toLowerCase().includes(searchTermLower);
                case "todos":
                default:
                    const updateDateDefault = new Date(sala.ultimaActualizacion);
                    return (
                        sala.n_sala.toLowerCase().includes(searchTermLower) ||
                        (sala.referencia || "").toLowerCase().includes(searchTermLower) ||
                        (sala.api_key_inbiot || "").toLowerCase().includes(searchTermLower) ||
                        updateDateDefault.toLocaleString().toLowerCase().includes(searchTermLower)
                    );
            }
        });
    };

    // Función para filtrar y notificar
    const handleFilter = (term: string, field: string) => {
        const filteredSalas = filterSalas(salas, term, field);
        onFilterChange(filteredSalas);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTerm = e.target.value;
        setSearchTerm(newTerm);
        handleFilter(newTerm, filterField);
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newField = e.target.value;
        setFilterField(newField);
        handleFilter(searchTerm, newField);
    };

    const filteredCount = useMemo(() => {
        return filterSalas(salas, searchTerm, filterField).length;
    }, [salas, searchTerm, filterField]);

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-64">
                    <select
                        value={filterField}
                        onChange={handleFieldChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos">Todos los campos</option>
                        <option value="sala">Sala</option>
                        <option value="referencia">Referencia</option>
                        <option value="actualizacion">Última Actualización</option>
                    </select>
                </div>
                <div className="flex-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar dispositivos..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
                Mostrando {filteredCount} de {salas.length} dispositivos
            </div>
        </div>
    );
}
