"use client";

import { updateHospital } from "@/actions/hospital/formHospital";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";



export default function EditarHospital({ hospital }: any) {

    const [id] = useState(hospital.id);
    const [nombre, setNombre] = useState(hospital.hospital || "");
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("Id", id);
        formData.append("Nombre", nombre);
        try {
            const result =await updateHospital(formData);
            if(result.ok===1){
            setIsOpen(false);
            toast.success(result.mensaje);
            }
        } catch (error) {
            console.error("Error al actualizar el hospital:", error);
            toast.error("Intentelo de Nuevo");
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                className="bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 rounded flex items-center justify-center transition-colors">
                <Pencil className="h-4 w-4 mr-1" />
                Editar
            </button>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
                    <div className={`bg-white p-6 rounded-lg shadow-lg ${isMobile ? 'w-full max-w-md' : 'w-96'}`}>
                        <h2 className="text-xl font-semibold mb-4">Editar Hospital</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input 
                                    type="text" 
                                    value={nombre} 
                                    onChange={(e) => setNombre(e.target.value)} 
                                    required 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsOpen(false)} 
                                    className="bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-500">
                                    Cancelar
                                </button>
                                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
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