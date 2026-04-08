"use client";

import { Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface Hospital {
  id: number;
  hospital: string;
}

interface Sala {
  id: number;
  n_sala: string;
}

interface AsignarSalaModalProps {
  purificadorId: string;
  salaAsignadaActual: number | null;
}

export default function AsignarSalaModal({ purificadorId, salaAsignadaActual }: AsignarSalaModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [hospitales, setHospitales] = useState<Hospital[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [selectedSala, setSelectedSala] = useState<string>("");

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

  // Cargar hospitales al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarHospitales();
    } else {
      // Limpiar estados al cerrar
      setSelectedHospital("");
      setSelectedSala("");
      setSalas([]);
    }
  }, [isOpen]);

  // Cargar salas al cambiar el hospital seleccionado
  useEffect(() => {
    if (selectedHospital) {
      cargarSalas(selectedHospital);
      setSelectedSala(""); // Resetear sala al cambiar hospital
    } else {
      setSalas([]);
      setSelectedSala("");
    }
  }, [selectedHospital]);

  const cargarHospitales = async () => {
    try {
      const res = await fetchWithAuth("/api/hospital/activos");
      if (!res.ok) throw new Error("Error al obtener hospitales");
      const data = await res.json();
      setHospitales(data);
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al cargar la lista de hospitales");
    }
  };

  const cargarSalas = async (hospitalId: string) => {
    try {
      const res = await fetchWithAuth(`/api/salas/activas?hospitalId=${hospitalId}`);
      if (!res.ok) throw new Error("Error al obtener salas");
      const data = await res.json();
      setSalas(data);
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al cargar la lista de salas");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSala) return;

    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/purificador/asignar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purificadorId,
          salaId: parseInt(selectedSala, 10),
        }),
      });

      toast.success("Sala asignada correctamente");
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al asignar la sala");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-slate-700 hover:bg-slate-800 text-white py-1 px-3 rounded flex items-center justify-center transition-colors text-xs font-medium whitespace-nowrap"
      >
        <Link2 className="h-4 w-4 mr-1" />
        {salaAsignadaActual ? "Reasignar Sala" : "Asignar Sala"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
          <div className={`bg-white p-6 rounded-lg shadow-lg ${isMobile ? "w-full max-w-md mx-4" : "w-96"}`}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Asignar Purificador a Sala</h2>
            <p className="text-sm text-gray-600 mb-4">
              Purificador ID: <span className="font-semibold text-gray-800">{purificadorId}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital
                </label>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                  required
                >  
                  <option value="" disabled>Seleccione un hospital</option>
                  {hospitales.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hospital}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sala
                </label>
                <select
                  value={selectedSala}
                  onChange={(e) => setSelectedSala(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={!selectedHospital || salas.length === 0}
                  required
                >
                  <option value="" disabled>
                    {!selectedHospital
                      ? "Primero seleccione un hospital"
                      : salas.length === 0
                      ? "Sin salas disponibles"
                      : "Seleccione una sala"}
                  </option>
                  {salas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.n_sala}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 border border-gray-300 font-medium"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedSala || loading}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center font-medium min-w-[100px]"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
