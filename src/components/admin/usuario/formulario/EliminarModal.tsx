"use client";

import { useState, useEffect } from "react";
import { deleteUser } from "@/actions/usuario/formUsuario";
import { AlertTriangle, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface EliminarModalProps { 
    userId: number;
    userName: string;
}

export default function EliminarModal({ userId, userName }: EliminarModalProps) {
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
            formData.append("userId", userId.toString());
            await deleteUser(formData);
            setIsOpen(false);
            toast.success("¡Usuario eliminado correctamente!");
        } catch (error) {
            console.error("Error al eliminar el usuario:", error);
            toast.error("Intentelo de Nuevo");
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded flex items-center justify-center transition-colors">
                  <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
            </button>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all p-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center">
                                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                                <h2 className="text-xl font-semibold text-gray-800">Eliminar Usuario</h2>
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
                                ¿Estás seguro de que deseas eliminar a <span className="font-semibold text-gray-900">{userName}</span>? Esta acción no se puede deshacer.
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
