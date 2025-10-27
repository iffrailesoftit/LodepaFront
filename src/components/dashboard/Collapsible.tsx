"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import BadgeList from "./BadgeList";
import { Hospital } from "@/actions/hospital/getHospital";
import { ListadoSalas } from "@/actions/hospital/sala/getListadoSalas";

export default function CollapsibleTree({ hospitals, id, rol }: { hospitals: Hospital[]; id: number; rol: number }) {
  const [expandedHospitals, setExpandedHospitals] = useState<number[]>([]);
  // Permitir null para indicar que se está cargando
  const [roomsData, setRoomsData] = useState<{ [key: number]: ListadoSalas[] | null }>({});

  const toggleHospital = async (hospitalId: number) => {
    if (expandedHospitals.includes(hospitalId)) {
      // Contraer hospital: removemos el ID
      setExpandedHospitals((prev) => prev.filter((id) => id !== hospitalId));
    } else {
      // Expandir hospital inmediatamente y marcar que se están cargando las salas
      setExpandedHospitals((prev) => [...prev, hospitalId]);
      setRoomsData((prev) => ({ ...prev, [hospitalId]: null }));

      try {
        const res = await fetch(`/api/hospital/listadoSala?id_hospital=${hospitalId}&id=${id}&rol=${rol}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error en API:", res.status, errorText);
          throw new Error("Error al obtener los datos de las salas");
        }
        const data = await res.json();
        setRoomsData((prev) => ({ ...prev, [hospitalId]: data }));
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    }
  };

  return (
    <>
      {hospitals.map((hospital: Hospital) => (
        <div key={hospital.id} className="mb-2">
          {/* Nivel del Hospital */}
          <button
            onClick={() => toggleHospital(hospital.id)}
            className="w-full flex items-center gap-2 p-3 text-lg font-semibold text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform ${expandedHospitals.includes(hospital.id) ? "rotate-0" : "-rotate-90"
                }`}
            />
            {hospital.hospital}
          </button>

          {/* Nivel de Salas */}
          {expandedHospitals.includes(hospital.id) && (
            <div className="ml-6">
              {roomsData[hospital.id] === null ? (
                <p>Cargando salas...</p>
              ) : roomsData[hospital.id] ? (
                <div className="mb-2">
                  <BadgeList data={roomsData[hospital.id]!} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
