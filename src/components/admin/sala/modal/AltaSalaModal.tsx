"use client"

import { altaSala } from "@/actions/hospital/sala/formSala";
import { SalasDispositivos } from "@/actions/hospital/sala/getSala";
import { CircleFadingPlus, AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Hospital } from "@/actions/hospital/getHospital";

interface AltaSalaModalProps {
    sala: SalasDispositivos
    hospital: Hospital
}

export default function AltaSalaModal({ sala, hospital }: AltaSalaModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            console.log(hospital[0].fecha_baja);
            if(hospital[0].fecha_baja){
                toast.error("Hospital de la sala no ha sido dado de alta");
                return;
            }
            const formData = new FormData();
            formData.append("Id", sala.id_sala.toString());
            await altaSala(formData);
            setIsOpen(false);
            toast.success("¡Sala dada de alta correctamente!");
            router.refresh();
        } catch (error) {
            console.error("Error al dar de alta la sala:", error);
            toast.error("Intentelo de Nuevo");
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded flex items-center justify-center transition-colors">
                <CircleFadingPlus className="h-4 w-4 mr-1" />
                Alta
            </button>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all p-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center">
                                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                                <h2 className="text-xl font-bold text-gray-800">Dar de Alta Sala</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                aria-label="Cerrar">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="py-6">
                            <p className="text-gray-600 mb-6">
                                ¿Estás seguro de que deseas dar de alta a <span className="font-semibold text-gray-900">{sala.n_sala}</span>?.
                            </p>
                            <form onSubmit={handleSubmit} className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors">
                                    Dar de Alta
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}