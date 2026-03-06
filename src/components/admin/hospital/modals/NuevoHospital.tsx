"use client";

import { crearHospital } from "@/actions/hospital/formHospital";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function NuevoHospital() {
    const [nombre, setNombre] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
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
        formData.append("Nombre", nombre);
        if (logoFile) {
            formData.append("Logo", logoFile);
        }
        try {
            const result = await crearHospital(formData);
            setIsOpen(false);
            setNombre("");
            setLogoFile(null);
            setLogoPreview("");
            toast.success(result.mensaje);
        } catch (error) {
            console.error("Error al crear el hospital:", error);
            toast.error("Intentelo de Nuevo");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setLogoFile(null);
            setLogoPreview("");
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Nuevo Hospital
            </button>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
                    <div className={`bg-white p-6 rounded-lg shadow-lg ${isMobile ? 'w-full max-w-md' : 'w-96'}`}>
                        <h2 className="text-xl font-semibold mb-4">Nuevo Hospital</h2>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo del Hospital</label>
                                <div className="flex items-center space-x-3">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo preview" className="w-12 h-12 object-contain rounded-md border border-gray-200 bg-gray-50 flex-shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-center p-1 text-gray-400 flex-shrink-0">
                                            Sin Logo
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100 cursor-pointer border border-gray-200 rounded-md p-1"
                                    />
                                </div>
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
