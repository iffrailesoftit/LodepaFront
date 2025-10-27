"use client";

import { useState, useEffect } from "react";

import { AlertTriangle, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { deleteAlerta } from "@/actions/alerta/formAlerta";
import { useRouter } from "next/navigation";

interface EliminarModalProps { 
    alertaId: number;
    refreshAlertas: () => void;
}

export default function EliminarAlerta({ alertaId, refreshAlertas }: EliminarModalProps) {
    
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

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
            const formData = new FormData();
            formData.append("alertaId", alertaId.toString());
            const result = await deleteAlerta(formData);
            if(result.ok===1){
                setIsOpen(false)
                toast.success(result.mensaje)
                router.refresh();
                refreshAlertas();
            }
        } catch (error) {
            console.error("Error al eliminar el usuario:", error);
            toast.error("Intentelo de Nuevo");
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded rounded-full flex items-center justify-center transition-colors">
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
            </button>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all p-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center">
                                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                                <h2 className="text-xl font-semibold text-gray-800">Eliminar Alerta</h2>
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
                                ¿Estás seguro de que deseas eliminar la alerta? Esta acción no se puede deshacer.
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
                                    className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 transition-colors">
                                    Eliminar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
