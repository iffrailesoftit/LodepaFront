"use client";

import { Hospital } from "@/actions/hospital/getHospital";
import { checkRefExists, updateCrearSala } from "@/actions/hospital/sala/formSala";
import { Pencil } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface SalaProps {
    sala: any;
    hospital: Hospital;
}

export default function EditarSala({ sala, hospital }: SalaProps) {
    const idhospital = hospital[0]?.id;

    // console.log("hospital", hospital)
    // console.log("hospital_id", idhospital)
    const [formData, setFormData] = useState({
        id: sala.id_sala,
        id_hospital: idhospital,
        sala: sala.n_sala || "",
        n_dispositivo: sala.n_dispositivo || "",
        referencia: sala.referencia || "",
        apikey: sala.api_key_inbiot || "",
    });

    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isCheckingRef, setIsCheckingRef] = useState(false);
    const [originalRef] = useState(sala.referencia);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const inputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const checkIfMobile = (): void => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);
        return () => {
            window.removeEventListener("resize", checkIfMobile);
        };
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "id" ? Number(value) : value,
        }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleRefChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        handleChange(e);
        if (value === originalRef || !value.trim()) return;
        setIsCheckingRef(true);
        try {
            const refExists = await checkRefExists(value, sala.id);
            if (refExists) {
                setErrors((prev) => ({
                    ...prev,
                    referencia: "Esta referencia ya está en uso",
                }));
            }
        } catch (error) {
            console.error("Error al verificar referencia:", error);
        } finally {
            setIsCheckingRef(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.sala.trim()) {
            newErrors.sala = "El nombre de la sala es obligatorio";
        }

        if (!formData.referencia.trim()) {
            newErrors.referencia = "La referencia es obligatoria";
        } else if (formData.referencia.includes(",")) {
            newErrors.referencia = "La referencia no puede contener comas";
        }

        if (!formData.apikey.trim()) {
            newErrors.apikey = "La API Key es obligatoria";
        } else if (formData.apikey.includes(",")) {
            newErrors.apikey = "La API Key no puede contener comas";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (isCheckingRef) return;
        // Si hay un error de email, no continuamos
        if (errors.referencia) {
            console.error("Error: La referencia ya está en uso.");
            return;
        }
        try {
            if (formRef.current) {
                const formData = new FormData(formRef.current);
                // Aquí llamarías a la función para actualizar la sala, por ejemplo:
                const result = await updateCrearSala(formData);
                setIsOpen(false);
                toast.success(result.mensaje);
            }
        } catch (error) {
            console.error("Error al actualizar la sala:", error);
            toast.error("Intentelo de Nuevo");
        }
    };

    return (
        <>
            {sala.id_sala !== 0 ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 rounded flex items-center justify-center transition-colors"
                >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                </button>) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    Nueva Sala
                </button>
            )}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className={`bg-white p-6 rounded-lg shadow-lg ${isMobile ? 'w-full max-w-md' : 'w-96'}`}>
                        <h2 className="text-xl font-semibold mb-4">
                            {sala.id_sala !== 0 ? "Editar Sala" : "Nueva Sala"}
                        </h2>
                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="hidden"
                                id="id_hospital"
                                name="id_hospital"
                                value={formData.id_hospital}
                                readOnly
                            />
                            <input
                                type="hidden"
                                id="id"
                                name="id"
                                value={formData.id}
                                readOnly
                            />
                            <div>
                                <label htmlFor="sala" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la Sala
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    id="sala"
                                    name="sala"
                                    value={formData.sala}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-3 py-2 border rounded-md ${errors.sala ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                                {errors.sala && <p className="mt-1 text-sm text-red-600">{errors.sala}</p>}
                            </div>
                            <div>
                                <label htmlFor="n_dispositivo" className="block text-sm font-medium text-gray-700 mb-1">
                                    S/N
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    id="n_dispositivo"
                                    name="n_dispositivo"
                                    value={formData.n_dispositivo}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-3 py-2 border rounded-md ${errors.sala ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                                {errors.sala && <p className="mt-1 text-sm text-red-600">{errors.sala}</p>}
                            </div>
                            <div>
                                <label htmlFor="referencia" className="block text-sm font-medium text-gray-700 mb-1">
                                    Referencia del Dispositivo (systemId)
                                </label>
                                <input
                                    type="text"
                                    id="referencia"
                                    name="referencia"
                                    value={formData.referencia}
                                    onChange={handleRefChange}
                                    className={`w-full px-3 py-2 border rounded-md ${errors.referencia ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                                {isCheckingRef && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                    </div>
                                )}
                                {errors.referencia && <p className="mt-1 text-sm text-red-600">{errors.referencia}</p>}
                            </div>
                            <div>
                                <label htmlFor="apikey" className="block text-sm font-medium text-gray-700 mb-1">
                                    API Key del Dispositivo
                                </label>
                                <input
                                    type="text"
                                    id="apikey"
                                    name="apikey"
                                    value={formData.apikey}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md ${errors.apikey ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                                {errors.apikey && <p className="mt-1 text-sm text-red-600">{errors.apikey}</p>}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                    disabled={isCheckingRef || !!errors.referencia}
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
