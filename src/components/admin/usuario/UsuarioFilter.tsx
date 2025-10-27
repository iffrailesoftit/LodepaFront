"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import type { Usuario } from "@/actions/usuario/getUsuario"

interface UsuarioFilterProps {
  usuarios: Usuario[]
  onFilterChange: (filteredUsuarios: Usuario[]) => void
}

export default function UsuarioFilter({ usuarios, onFilterChange }: UsuarioFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterField, setFilterField] = useState("todos")

  // Función para filtrar usuarios
  const handleFilter = (term: string, field: string) => {
    const filteredUsuarios = usuarios.filter((usuario) => {
      if (!term.trim()) return true

      const searchTermLower = term.toLowerCase()

      switch (field) {
        case "nombre":
          return usuario.nombre.toLowerCase().includes(searchTermLower)
        case "apellido":
          return usuario.apellido.toLowerCase().includes(searchTermLower)
        case "email":
          return usuario.email.toLowerCase().includes(searchTermLower)
        case "telefono":
          return usuario.telefono?.toLowerCase().includes(searchTermLower) || false
        case "rol":
          return usuario.rol.rol.toLowerCase().includes(searchTermLower)
        case "hospital":
          return usuario.hospitales.some((h) => h.hospital.toLowerCase().includes(searchTermLower))
        case "sala":
          return usuario.hospitales.some((h) => h.salas.some((s) => s.n_sala.toLowerCase().includes(searchTermLower)))
        case "todos":
        default:
          return (
            usuario.nombre.toLowerCase().includes(searchTermLower) ||
            usuario.apellido.toLowerCase().includes(searchTermLower) ||
            usuario.email.toLowerCase().includes(searchTermLower) ||
            (usuario.telefono && usuario.telefono.toLowerCase().includes(searchTermLower)) ||
            usuario.rol.rol.toLowerCase().includes(searchTermLower) ||
            usuario.hospitales.some((h) => h.hospital.toLowerCase().includes(searchTermLower)) ||
            usuario.hospitales.some((h) => h.salas.some((s) => s.n_sala.toLowerCase().includes(searchTermLower)))
          )
      }
    })

    onFilterChange(filteredUsuarios)
  }

  // Actualizar filtro cuando cambia el término de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value
    setSearchTerm(newTerm)
    handleFilter(newTerm, filterField)
  }

  // Actualizar filtro cuando cambia el campo de filtrado
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newField = e.target.value
    setFilterField(newField)
    handleFilter(searchTerm, newField)
  }

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
            <option value="nombre">Nombre</option>
            <option value="apellido">Apellido</option>
            <option value="email">Email</option>
            <option value="telefono">Teléfono</option>
            <option value="rol">Rol</option>
            <option value="hospital">Hospital</option>
            <option value="sala">Sala</option>
          </select>
        </div>
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Mostrando{" "}
        {
          usuarios.filter((usuario) => {
            if (!searchTerm.trim()) return true

            const searchTermLower = searchTerm.toLowerCase()

            switch (filterField) {
              case "nombre":
                return usuario.nombre.toLowerCase().includes(searchTermLower)
              case "apellido":
                return usuario.apellido.toLowerCase().includes(searchTermLower)
              case "email":
                return usuario.email.toLowerCase().includes(searchTermLower)
              case "telefono":
                return usuario.telefono?.toLowerCase().includes(searchTermLower) || false
              case "rol":
                return usuario.rol.rol.toLowerCase().includes(searchTermLower)
              case "hospital":
                return usuario.hospitales.some((h) => h.hospital.toLowerCase().includes(searchTermLower))
              case "sala":
                return usuario.hospitales.some((h) =>
                  h.salas.some((s) => s.n_sala.toLowerCase().includes(searchTermLower)),
                )
              case "todos":
              default:
                return (
                  usuario.nombre.toLowerCase().includes(searchTermLower) ||
                  usuario.apellido.toLowerCase().includes(searchTermLower) ||
                  usuario.email.toLowerCase().includes(searchTermLower) ||
                  (usuario.telefono && usuario.telefono.toLowerCase().includes(searchTermLower)) ||
                  usuario.rol.rol.toLowerCase().includes(searchTermLower) ||
                  usuario.hospitales.some((h) => h.hospital.toLowerCase().includes(searchTermLower)) ||
                  usuario.hospitales.some((h) => h.salas.some((s) => s.n_sala.toLowerCase().includes(searchTermLower)))
                )
            }
          }).length
        }{" "}
        de {usuarios.length} usuarios
      </div>
    </div>
  )
}

