"use client"

import { useState, useEffect } from "react"
import type { Usuario } from "@/actions/usuario/getUsuario"
import UsuarioRow from "./UsuarioRow"
import UsuarioFilter from "./UsuarioFilter"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import EliminarModal from "./formulario/EliminarModal"
import { useRouter } from 'next/navigation';


interface UsuarioTableProps {
  usuarios: Usuario[]
}

export default function UsuarioTable({ usuarios }: UsuarioTableProps) {
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>(usuarios)
  const [isMobile, setIsMobile] = useState(false)
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage)

  // Usuarios para la página actual
  const currentUsuarios = filteredUsuarios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const router = useRouter();
  const handleRedirigir = (id: number) => {
    // Puedes pasar parámetros en la URL, por ejemplo:
    router.push(`/dashboard/admin/usuario/${id}`);
  };

  // *Observa* cuando cambian las props "usuarios" y actualiza el estado:
  useEffect(() => {
    setFilteredUsuarios(usuarios);
  }, [usuarios]);

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

  return (
    <div className="space-y-4">
      {/* Componente de filtro */}
      <UsuarioFilter
        usuarios={usuarios}
        onFilterChange={(filtered) => {
          setFilteredUsuarios(filtered)
          setCurrentPage(1) // Resetear a primera página cuando cambia el filtro
        }}
      />

      {/* Mensaje cuando no hay resultados */}
      {filteredUsuarios.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          No se encontraron usuarios con los criterios de búsqueda.
        </div>
      )}

      {/* Vista móvil: Tarjetas en lugar de tabla */}
      {isMobile && filteredUsuarios.length > 0 && (
        <div className="space-y-4 md:hidden">
          {currentUsuarios.map((usuario) => (
            <div key={usuario.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">
                  {usuario.nombre} {usuario.apellido}
                </h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {usuario.rol.rol}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">ID:</span> {usuario.id}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {usuario.email}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span> {usuario.telefono || "N/A"}
                </p>

                <div>
                  <span className="font-medium">Hospitales:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {usuario.hospitales.length > 0
                      ? usuario.hospitales.map((h) => (
                          <span
                            key={h.id}
                            className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {h.hospital}
                          </span>
                        ))
                      : "Ninguno"}
                  </div>
                </div>

                <div>
                  <span className="font-medium">Salas:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {usuario.hospitales.flatMap((h) => h.salas).length > 0
                      ? usuario.hospitales
                          .flatMap((h) => h.salas)
                          .map((s) => (
                            <span
                              key={s.id}
                              className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {s.n_sala}
                            </span>
                          ))
                      : "Ninguna"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button onClick={() => handleRedirigir(usuario.id)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded flex items-center justify-center transition-colors">
                <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <EliminarModal userId={usuario.id} userName={usuario.nombre} />                    
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
              <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Apellido</th>
              <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
              {/* <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Contraseña</th> */}
              <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Teléfono</th>
              <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rol</th>
              <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Hospitales</th>
              <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Salas</th>
              <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" colSpan={2}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentUsuarios.map((usuario) => (
              <UsuarioRow key={usuario.id} usuario={usuario} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filteredUsuarios.length > 0 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === totalPages
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
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsuarios.length)}</span> de{" "}
                <span className="font-medium">{filteredUsuarios.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                    currentPage === 1
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
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        currentPage === pageNum ? "bg-blue-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                    currentPage === totalPages
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




