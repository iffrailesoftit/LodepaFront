"use client"

import type React from "react"

import { updateCrearAlerta } from "@/actions/alerta/formAlerta"
import type { ConfAlerta } from "@/actions/alerta/getAlertaConf"
import { getParametrosAlerta, type ParametrosAlerta } from "@/actions/alerta/getAlertaParametros"
import type { Hospital } from "@/actions/hospital/getHospital"
import type { Salas } from "@/actions/hospital/sala/getSala"
import { getUsuarioSalas, type UsuarioSala } from "@/actions/usuario/getUsuario"
import { Clock, Home, MapPin, Plus, X, AlertTriangle, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { formatMeasurementName } from "@/lib/status-ranges"

interface ParametroConfig {
    id: number
    enabled: boolean
    min_warning: number
    max_warning: number
}

interface ConfAlertProps {
    confAlerta: ConfAlerta
    id_usuario: number
    hospitales: Hospital[]
    salas: Salas[]
    refreshAlertas: () => void
}

export default function NuevaAlerta({ confAlerta, hospitales, salas, refreshAlertas }: ConfAlertProps) {
    const router = useRouter()
    const [usuarios, setUsuarios] = useState<UsuarioSala[]>([])
    const [page, setPage] = useState(1)
    const [parametros, setParametros] = useState<ParametrosAlerta[]>([])
    const [parametrosConfig, setParametrosConfig] = useState<Record<number, ParametroConfig>>({})
    const [formData, setFormData] = useState({
        id: confAlerta.id || 0,
        sala_id: confAlerta.sala_id || 0,
        n_sala: confAlerta.n_sala || "",
        hospital_id: confAlerta.hospital_id || confAlerta.referencia || 0,
        hospital: confAlerta.hospital || confAlerta.api_key_inbiot || "",
        usuario_id: confAlerta.usuario_id || 0,
        hora_min: confAlerta.hora_min || 0,
        hora_max: confAlerta.hora_max || 24,
    })

    const fetchUsuarios = async (id_sala: number) => {
        try {
            const data = await getUsuarioSalas(id_sala)
            setUsuarios(data)
        } catch (e) {
            console.error(e)
        }
    }

    const fetchParametros = async (id: number) => {
        try {
            const dataParams = await getParametrosAlerta(id)
            setParametros(dataParams)
            
            // Inicializar configuración de parámetros
            const initialConfig: Record<number, ParametroConfig> = {}
            dataParams.forEach((param) => {
                initialConfig[param.rowid] = {
                    id: param.rowid,
                    enabled: Boolean(param.estado),
                    min_warning: param.min_warning || 0,
                    max_warning: param.max_warning || 100,
                }
            })
            // console.log(initialConfig)

            setParametrosConfig(initialConfig)
            
        } catch (e) {
            console.error(e)
        }
    }

   

    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [filteredSalas, setFilteredSalas] = useState<Salas[]>([])

    const modalRef = useRef<HTMLDivElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

    // Detectar si es dispositivo móvil
    useEffect(() => {
        const checkIfMobile = (): void => {
            setIsMobile(window.innerWidth < 768)
        }

        checkIfMobile()
        window.addEventListener("resize", checkIfMobile)
        return () => {
            window.removeEventListener("resize", checkIfMobile)
        }
    }, [])

    // Obtener parametros de la alerta
    useEffect(() => {
        fetchParametros(formData.id)
    }, [formData.id])

    // Filtrar salas según el hospital seleccionado
    useEffect(() => {
        if (formData.hospital_id) {
            setFilteredSalas(salas.filter((sala) => sala.hospital === formData.hospital_id))
        } else {
            setFilteredSalas([])
        }
    }, [formData.hospital_id, salas])

    // Obtener usuarios según la sala seleccionada
    useEffect(() => {
        if (formData.sala_id) {
            fetchUsuarios(formData.sala_id)
        }
    }, [formData.sala_id])

    // Cerrar modal al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        if (name === "hora_min" || name === "hora_max") {
            const hourValue = Number.parseInt(value, 10)
            if (isNaN(hourValue)) {
                setFormData((prev) => ({
                    ...prev,
                    [name]: 0,
                }))
            } else {
                const validHour = Math.min(Math.max(hourValue, 0), 24)
                setFormData((prev) => ({
                    ...prev,
                    [name]: validHour,
                }))
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: name === "hospital_id" || name === "sala_id" ? Number(value) : value,
            }))
        }

        // Limpiar error del campo
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    // Manejar cambios en los parámetros
    const handleParametroChange = (parametroId: number, field: keyof ParametroConfig, value: boolean | number) => {
        setParametrosConfig((prev) => ({
            ...prev,
            [parametroId]: {
                ...prev[parametroId],
                [field]: value,
            },
        }))
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (page === 1) {
            if (!formData.hospital_id) {
                newErrors.hospital_id = "Selecciona un hospital"
            }
            if (!formData.sala_id) {
                newErrors.sala_id = "Selecciona una sala"
            }
            if (!formData.usuario_id) {
                newErrors.usuario_id = "Selecciona un usuario"
            }
            if (formData.hora_min === undefined || formData.hora_min === null) {
                newErrors.hora_min = "La hora de inicio es obligatoria"
            }
            if (formData.hora_max === undefined || formData.hora_max === null) {
                newErrors.hora_max = "La hora de fin es obligatoria"
            }
            if (formData.hora_min >= formData.hora_max) {
                newErrors.hora_max = "La hora de fin debe ser posterior a la hora de inicio"
            }
        } else if (page === 2) {
            // Validar que al menos un parámetro esté habilitado
            const enabledParams = Object.values(parametrosConfig).filter((config) => config.enabled)
            if (enabledParams.length === 0) {
                newErrors.parametros = "Debe seleccionar al menos un parámetro"
            }

            // Validar rangos de parámetros habilitados
            Object.entries(parametrosConfig).forEach(([id, config]) => {
                if (config.enabled) {
                    if (Number(config.min_warning) >= Number(config.max_warning)) {
                        newErrors[`parametro_${id}`] = "El valor mínimo debe ser menor que el máximo"
                    }
                }
            })
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateForm()) {
            setPage(2)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            if (formRef.current) {
                const formDataToSend = new FormData(formRef.current)
                // console.log(formRef)

                // Agregar parámetros habilitados al FormData
                const enabledParams = Object.values(parametrosConfig)
                const result = await updateCrearAlerta(formDataToSend,enabledParams)

                if (result.ok === 1) {
                    // 1) recarga los parámetros desde el servidor
                    await fetchParametros(formData.id);
                    setIsOpen(false)
                    setPage(1)
                    toast.success(result.mensaje)
                    router.refresh()
                    refreshAlertas()
                } else {
                    toast.error(result.mensaje || "Error al guardar la alerta")
                }
            }
        } catch (error) {
            console.error("Error al guardar la alerta:", error)
            toast.error("Error al guardar la alerta. Inténtelo de nuevo.")
        }
    }

    const resetForm = () => {
        setPage(1)
        setErrors({})
        // Resetear configuración de parámetros
        const resetConfig: Record<number, ParametroConfig> = {}
        parametros.forEach((param) => {
            resetConfig[param.rowid] = {
                id: param.rowid,
                enabled: Boolean(param.estado),
                min_warning: param.min_warning || 0,
                max_warning: param.max_warning || 100,
            }
        })
        setParametrosConfig(resetConfig)
    }

    return (
        <>
            {confAlerta.id !== 0 ? (
                <button
                    onClick={() => {
                        setIsOpen(true)
                        resetForm()
                    }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-amber-300 text-sm font-medium rounded-full text-amber-700 bg-white hover:bg-amber-50 transition-colors"
                >
                    Editar
                </button>
            ) : (
                <button
                    onClick={() => {
                        setIsOpen(true)
                        resetForm()
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Alerta
                </button>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        ref={modalRef}
                        className={`bg-white rounded-2xl shadow-xl ${isMobile ? "w-full" : "w-[500px]"} max-h-[90vh] overflow-y-auto`}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center">
                                <h2 className="text-xl font-medium text-gray-800">
                                    {confAlerta.id !== 0 ? "Editar Alerta" : "Nueva Alerta"}
                                </h2>
                                <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Paso {page} de 2
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    resetForm()
                                }}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form ref={formRef} onSubmit={handleSubmit} className="p-6">
                            <input type="hidden" name="id" value={formData.id} />
                            <input type="hidden" name="usuario_id" value={formData.usuario_id} />
                            <input type="hidden" name="hospital_id" value={formData.hospital_id} />
                            <input type="hidden" name="sala_id" value={formData.sala_id} />
                            <input type="hidden" name="hora_min" value={formData.hora_min} />
                            <input type="hidden" name="hora_max" value={formData.hora_max} />
                            {page === 1 ? (
                                <div className="space-y-5">
                                    {/* Hospital */}
                                    <div>
                                        <label htmlFor="hospital_id" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                            <Home className="h-4 w-4 mr-1 text-gray-400" />
                                            Hospital
                                        </label>
                                        <select
                                            id="hospital_id"
                                            name="hospital_id"
                                            value={formData.hospital_id || ""}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 border rounded-full text-sm ${errors.hospital_id ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                                                } focus:outline-none focus:ring-2 focus:border-transparent`}
                                        >
                                            <option value="">Selecciona un hospital</option>
                                            {hospitales.map((hospital) => (
                                                <option key={hospital.id} value={hospital.id}>
                                                    {hospital.hospital}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.hospital_id && <p className="mt-1 text-sm text-red-600">{errors.hospital_id}</p>}
                                    </div>

                                    {/* Sala */}
                                    <div>
                                        <label htmlFor="sala_id" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                            Sala
                                        </label>
                                        <select
                                            id="sala_id"
                                            name="sala_id"
                                            value={formData.sala_id || ""}
                                            onChange={handleChange}
                                            disabled={!formData.hospital_id}
                                            className={`w-full px-4 py-2.5 border rounded-full text-sm ${errors.sala_id ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                                                } focus:outline-none focus:ring-2 focus:border-transparent ${!formData.hospital_id ? "bg-gray-100 cursor-not-allowed" : ""
                                                }`}
                                        >
                                            <option value="">Selecciona una sala</option>
                                            {filteredSalas.map((sala) => (
                                                <option key={sala.id} value={sala.id}>
                                                    {sala.n_sala}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.sala_id && <p className="mt-1 text-sm text-red-600">{errors.sala_id}</p>}
                                        {!formData.hospital_id && !errors.sala_id && (
                                            <p className="mt-1 text-sm text-gray-500">Primero selecciona un hospital</p>
                                        )}
                                    </div>

                                    {/* Usuario */}
                                    <div>
                                        <label htmlFor="usuario_id" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                            Usuario
                                        </label>
                                        <select
                                            id="usuario_id"
                                            name="usuario_id"
                                            value={formData.usuario_id || ""}
                                            onChange={handleChange}
                                            disabled={!formData.sala_id}
                                            className={`w-full px-4 py-2.5 border rounded-full text-sm ${errors.usuario_id ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                                                } focus:outline-none focus:ring-2 focus:border-transparent ${!formData.sala_id ? "bg-gray-100 cursor-not-allowed" : ""
                                                }`}
                                        >
                                            <option value="">Selecciona un usuario</option>
                                            {usuarios.map((usuario) => (
                                                <option key={usuario.id} value={usuario.id}>
                                                    {usuario.nombre} {usuario.apellido}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.usuario_id && <p className="mt-1 text-sm text-red-600">{errors.usuario_id}</p>}
                                        {!formData.sala_id && !errors.usuario_id && (
                                            <p className="mt-1 text-sm text-gray-500">Primero selecciona una sala</p>
                                        )}
                                    </div>

                                    {/* Horario */}
                                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                                        <h3 className="flex items-center text-sm font-medium text-gray-700 mb-3">
                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                            Horario de Monitoreo (Horas)
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="hora_min" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Desde
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        id="hora_min"
                                                        name="hora_min"
                                                        min="0"
                                                        max="24"
                                                        value={formData.hora_min}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-2 border rounded-full text-sm ${errors.hora_min
                                                                ? "border-red-500 focus:ring-red-500"
                                                                : "border-gray-200 focus:ring-blue-500"
                                                            } focus:outline-none focus:ring-2 focus:border-transparent`}
                                                    />
                                                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                        h
                                                    </span>
                                                </div>
                                                {errors.hora_min && <p className="mt-1 text-sm text-red-600">{errors.hora_min}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="hora_max" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Hasta
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        id="hora_max"
                                                        name="hora_max"
                                                        min="0"
                                                        max="24"
                                                        value={formData.hora_max}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-2 border rounded-full text-sm ${errors.hora_max
                                                                ? "border-red-500 focus:ring-red-500"
                                                                : "border-gray-200 focus:ring-blue-500"
                                                            } focus:outline-none focus:ring-2 focus:border-transparent`}
                                                    />
                                                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                        h
                                                    </span>
                                                </div>
                                                {errors.hora_max && <p className="mt-1 text-sm text-red-600">{errors.hora_max}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones */}
                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsOpen(false)
                                                resetForm()
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Parámetros de la alerta */}
                                    <div>
                                        <div className="flex items-center mb-4">
                                            <Settings className="h-5 w-5 mr-2 text-gray-400" />
                                            <h3 className="text-lg font-medium text-gray-800">Configuración de Parámetros</h3>
                                        </div>

                                        
                                        <div className="space-y-4">
                                            {parametros.map((parametro) => {
                                                const config = parametrosConfig[parametro.rowid]
                                                
                                                if (!config) return null

                                                return (
                                                    <div
                                                        key={parametro.rowid}
                                                        className={`border rounded-lg p-4 transition-all ${config.enabled ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <label className="flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={config.enabled}
                                                                    onChange={(e) => handleParametroChange(parametro.rowid, "enabled", e.target.checked)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                                                                />
                                                                <span className="text-sm font-medium text-gray-700">{formatMeasurementName(parametro.parametro)}</span>
                                                            </label>
                                                            {config.enabled && <AlertTriangle className="h-4 w-4 text-blue-500" />}
                                                        </div>

                                                        {config.enabled && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor Mínimo</label>
                                                                    <input
                                                                        type="number"
                                                                        value={config.min_warning}
                                                                        onChange={(e) =>
                                                                            handleParametroChange(parametro.rowid, "min_warning", Number(e.target.value))
                                                                        }
                                                                        className={`w-full px-3 py-2 border rounded-md text-sm ${errors[`parametro_${parametro.rowid}`]
                                                                                ? "border-red-500 focus:ring-red-500"
                                                                                : "border-gray-300 focus:ring-blue-500"
                                                                            } focus:outline-none focus:ring-1`}
                                                                        placeholder="Min"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor Máximo</label>
                                                                    <input
                                                                        type="number"
                                                                        value={config.max_warning}
                                                                        onChange={(e) =>
                                                                            handleParametroChange(parametro.rowid, "max_warning", Number(e.target.value))
                                                                        }
                                                                        className={`w-full px-3 py-2 border rounded-md text-sm ${errors[`parametro_${parametro.rowid}`]
                                                                                ? "border-red-500 focus:ring-red-500"
                                                                                : "border-gray-300 focus:ring-blue-500"
                                                                            } focus:outline-none focus:ring-1`}
                                                                        placeholder="Max"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {errors[`parametro_${parametro.rowid}`] && (
                                                            <p className="mt-2 text-xs text-red-600">{errors[`parametro_${parametro.rowid}`]}</p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                            

                                        </div>
                                        {errors.parametros && (
                                            <div className="mb-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-600">{errors.parametros}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botones */}
                                    <div className="flex justify-between space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setPage(1)}
                                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            Volver
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                        >
                                            {confAlerta.id !== 0 ? "Actualizar" : "Guardar"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}