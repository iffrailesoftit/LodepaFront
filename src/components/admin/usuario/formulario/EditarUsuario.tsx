"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Building2, Trash2, Save } from "lucide-react"
import type { Hospital } from "@/actions/hospital/getHospital"
import type { Sala } from "@/actions/hospital/sala/getSala"
import type { Rol } from "@/actions/usuario/getRol"
import type { Usuario } from "@/actions/usuario/getUsuario"
import { editUser, checkEmailExists } from "@/actions/usuario/formUsuario"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

// Estructura que usaremos para guardar cada hospital agregado con sus salas seleccionadas
interface UserHospital {
  hospitalId: number
  salaIds: number[]
}

interface EditarUsuarioProps {
  user: Usuario
  roles: Rol[]
  hospitales: Hospital[]
  onClose?: () => void // Opcional para cerrar el modal
}

export default function EditarUsuario({ user, roles, hospitales, onClose }: EditarUsuarioProps) {
  // Inicializamos los hospitales que ya tiene el usuario con sus salas asignadas
  const initialUserHospitals: UserHospital[] = user.hospitales.map((h) => ({
    hospitalId: h.id,
    // Guardamos todas las salas que ya tiene asignadas el usuario para este hospital
    salaIds: h.salas.map((s) => s.id),
  }))

  const [formData, setFormData] = useState({
    id: user.id,
    apellido: user.apellido || "",
    email: user.email,
    nombre: user.nombre || "",
    telefono: user.telefono || "",
    password: "",
    rol: user.rol.id,
    // Usaremos un array de objetos con el id del hospital y los ids de las salas seleccionadas
    userHospitales: initialUserHospitals as UserHospital[],
  })
  const router = useRouter();
  // Estado para errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Estado para indicar si el formulario está siendo enviado
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Estado para controlar si estamos verificando el email
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  // Estado para almacenar el email original del usuario
  const [originalEmail] = useState(user.email)

  // Mapeo de hospitalId a array de salas disponibles
  const [salasMapping, setSalasMapping] = useState<{ [key: number]: Sala[] }>({})

  // Referencia al formulario para poder enviarlo programáticamente
  const formRef = useRef<HTMLFormElement>(null)

  // Cargar las salas para los hospitales ya asignados al usuario
  useEffect(() => {
    const loadInitialSalas = async () => {
      const initialMapping: { [key: number]: Sala[] } = {}

      for (const hospital of user.hospitales) {
        try {
          // Obtener todas las salas disponibles para este hospital desde la API
          const res = await fetch(`/api/hospital/${hospital.id}/sala`)
          if (res.ok) {
            const salas = await res.json()
            initialMapping[hospital.id] = salas
          } else {
            console.error(`Error al cargar salas para hospital ${hospital.id}: ${res.statusText}`)
            // Si hay error, usamos las salas que ya tiene asignadas como fallback
            initialMapping[hospital.id] = hospital.salas as Sala[]
          }
        } catch (error) {
          console.error(`Error al cargar salas para hospital ${hospital.id}:`, error)
          // Si hay error, usamos las salas que ya tiene asignadas como fallback
          initialMapping[hospital.id] = hospital.salas as Sala[]
        }
      }

      setSalasMapping(initialMapping)
    }

    loadInitialSalas()
  }, [user.hospitales])

  // Función para manejar los inputs simples del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "id" ? Number(value) : value,
    }))

    // Limpiar error cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Función para verificar si el email ya existe cuando el usuario cambia el campo
  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target

    // Actualizar el estado del formulario
    handleChange(e)

    // Si el email no ha cambiado respecto al original, no es necesario verificar
    if (value === originalEmail) {
      return
    }

    // Verificar si el email es válido antes de hacer la comprobación
    if (!/\S+@\S+\.\S+/.test(value)) {
      return
    }

    setIsCheckingEmail(true)

    try {
      // Verificar si el email ya existe
      const emailExists = await checkEmailExists(value, user.id)

      if (emailExists) {
        setErrors((prev) => ({
          ...prev,
          email: "Este email ya está siendo utilizado por otro usuario",
        }))
      }
    } catch (error) {
      console.error("Error al verificar email:", error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Función para agregar un hospital seleccionado mediante un select
  const handleAddHospital = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hospitalId = e.target.value ? Number(e.target.value) : null
    if (hospitalId && !formData.userHospitales.some((uh) => uh.hospitalId === hospitalId)) {
      try {
        // Obtener las salas disponibles para este hospital desde la API
        const res = await fetch(`/api/hospital/${hospitalId}/sala`)

        if (res.ok) {
          const fetchedSalas: Sala[] = await res.json()

          // Actualizamos el mapping con las salas obtenidas
          setSalasMapping((prev) => ({
            ...prev,
            [hospitalId]: fetchedSalas,
          }))

          // Agregamos el hospital al array del formulario (inicialmente sin salas seleccionadas)
          setFormData((prev) => ({
            ...prev,
            userHospitales: [...prev.userHospitales, { hospitalId, salaIds: [] }],
          }))
        } else {
          console.error(`Error al obtener salas para el hospital ${hospitalId}: ${res.statusText}`)
          // Mostrar un mensaje de error al usuario
          setErrors((prev) => ({
            ...prev,
            form: `No se pudieron cargar las salas para el hospital seleccionado. ${res.statusText}`,
          }))
        }
      } catch (error) {
        console.error("Error al obtener salas para el hospital:", error)
        // Mostrar un mensaje de error al usuario
        setErrors((prev) => ({
          ...prev,
          form: "Error al obtener salas para el hospital seleccionado. Por favor, inténtalo de nuevo.",
        }))
      }
    }
    // Reiniciamos el select
    e.target.value = ""
  }

  // Función para quitar un hospital del array
  const handleRemoveHospital = (hospitalId: number) => {
    setFormData((prev) => ({
      ...prev,
      userHospitales: prev.userHospitales.filter((uh) => uh.hospitalId !== hospitalId),
    }))
  }

  // Función para manejar la selección/deselección de una sala
  const handleSalaToggle = (hospitalId: number, salaId: number) => {
    setFormData((prev) => ({
      ...prev,
      userHospitales: prev.userHospitales.map((uh) => {
        if (uh.hospitalId === hospitalId) {
          // Si la sala ya está seleccionada, la quitamos; si no, la agregamos
          const salaIds = uh.salaIds.includes(salaId)
            ? uh.salaIds.filter((id) => id !== salaId)
            : [...uh.salaIds, salaId]

          return { ...uh, salaIds }
        }
        return uh
      }),
    }))
  }

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es obligatorio"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }

    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria"
    } else if (formData.password.length < 4) {
      newErrors.password = "La contraseña debe tener al menos 4 caracteres"
    }

    // Validar que el teléfono sea obligatorio
    if (!formData.telefono) {
      newErrors.telefono = "El teléfono es obligatorio"
    } else
      if (!/^\d{9,}$/.test(formData.telefono)) {
        newErrors.telefono = "El teléfono debe tener al menos 9 dígitos"
      }

    // Validar que el rol sea obligatorio
    // CONTROL DE PERMISOS 
    if (!formData.rol) {
      newErrors.rol = "El rol es obligatorio"
    }

    // Validaciones específicas según el rol
    if (formData.rol == 2) {
      // Si es Doctor
      if (formData.userHospitales.length === 0) {
        newErrors.hospitales = "Debes asignar al menos un hospital"
      }
    }

    if (formData.rol == 3) {
      // Si es Enfermero
      const tieneSalasAsignadas = formData.userHospitales.some((uh) => uh.salaIds.length > 0)
      if (!tieneSalasAsignadas) {
        newErrors.hospitales = "Debes asignar al menos una sala"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Modificar la función handleSubmit para manejar errores correctamente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Si estamos verificando el email, esperamos
    if (isCheckingEmail) {
      return
    }

    // Si hay un error de email, no continuamos
    if (errors.email) {
      return
    }

    setIsSubmitting(true)

    try {
      // El formulario se enviará a través de la acción del servidor
      if (formRef.current) {
        const formData = new FormData(formRef.current)
        const result = await editUser(formData)

        toast.success(result.mensaje);

        // Si hay función de cierre, cerrar después de 2 segundos
        if (onClose) {
          setTimeout(() => {
            onClose()
          }, 2000)
        }

        if (result.ok === 1) {
          if (result.patch) {
            router.push(result.patch)
          }
        }
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error)

      // Verificar si el mensaje de error contiene información sobre el email
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el usuario"

      if (errorMessage.toLowerCase().includes("email")) {
        setErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }))
      } else {
        setErrors((prev) => ({
          ...prev,
          form: errorMessage,
        }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lista de hospitales disponibles para agregar (excluyendo los ya seleccionados)
  const availableHospitals = hospitales.filter((h) => !formData.userHospitales.some((uh) => uh.hospitalId === h.id))

  // Modificar la referencia al formulario para usar onSubmit en lugar de action
  return (
    <div className="container mx-auto px-4 py-3">
      <div className="w-full max-w-3xl mx-auto">

        {/* Error general del formulario */}
        {errors.form && <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">{errors.form}</div>}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica del usuario */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID (solo lectura) */}

              <input
                type="hidden"
                id="id"
                name="id"
                value={formData.id}
                readOnly
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
              />


              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.nombre ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
              </div>

              {/* Apellido */}
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.apellido ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.apellido && <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.email ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.telefono ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.password ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />

                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.rol ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}

                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.rol}
                    </option>
                  ))}
                </select>
                {errors.rol && <p className="mt-1 text-sm text-red-600">{errors.rol}</p>}
              </div>
            </div>
          </div>

          {/* Sección de hospitales */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Hospitales Asignados
              {formData.rol === 2 && <span className="text-red-500 ml-1">*</span>}
            </h3>

            {errors.hospitales && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{errors.hospitales}</div>
            )}

            {/* Selector para agregar hospitales */}
            <div className="mb-6">
              <label htmlFor="add-hospital" className="block text-sm font-medium text-gray-700 mb-2">
                Agregar Hospital
              </label>
              <div className="flex">
                <select
                  id="add-hospital"
                  onChange={handleAddHospital}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un hospital</option>
                  {availableHospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.hospital}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de hospitales agregados */}
            <div className="space-y-4">
              {formData.userHospitales.length === 0 ? (
                <p className="text-gray-500 italic">No hay hospitales asignados</p>
              ) : (
                formData.userHospitales.map((uh) => {
                  // Obtenemos la información del hospital agregado
                  const hospitalInfo = hospitales.find((h) => h.id === uh.hospitalId)
                  // Obtenemos las salas del mapping para ese hospital
                  const salasDisponibles = salasMapping[uh.hospitalId] || []

                  return (
                    <div key={uh.hospitalId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <Building2 className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium text-gray-800">
                            {hospitalInfo?.hospital || `Hospital ID: ${uh.hospitalId}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHospital(uh.hospitalId)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          aria-label="Eliminar hospital"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Campo oculto para el ID del hospital */}
                      <input type="hidden" name={`hospitales`} value={uh.hospitalId} />

                      {/* Selección múltiple de salas con checkboxes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salas Asignadas
                          {formData.rol === 3 && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {salasDisponibles.length === 0 ? (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-500 italic">No hay salas disponibles para este hospital</p>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {salasDisponibles.map((sala) => {
                              const isChecked = uh.salaIds.includes(sala.id)
                              return (
                                <div key={sala.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`sala-${uh.hospitalId}-${sala.id}`}
                                    checked={isChecked}
                                    onChange={() => handleSalaToggle(uh.hospitalId, sala.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  {/* Campo oculto para enviar las salas seleccionadas */}
                                  {isChecked && <input type="hidden" name={`salas-${uh.hospitalId}`} value={sala.id} />}
                                  <label
                                    htmlFor={`sala-${uh.hospitalId}-${sala.id}`}
                                    className="ml-2 block text-sm text-gray-700"
                                  >
                                    {sala.n_sala}
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              disabled={isSubmitting || isCheckingEmail}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

