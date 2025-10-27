import { getSalaYDispositivoByHospital } from "@/actions/hospital/sala/getSala";
import SalaTable from "./SalaTable";
import { getHospitalByID } from "@/actions/hospital/getHospital";
import EditarSala from "./modal/EditarSala";

interface SalaProps {
  hospitalId: number;
}

export default async function Sala({hospitalId}: SalaProps) {
    const hospital = await getHospitalByID(hospitalId);
    const salas = await getSalaYDispositivoByHospital(hospitalId);
    const sala:any={
      id_sala: 0,
      n_sala: "",
      referencia: "",
      api_key_inbiot: "",
      encendido: "N"
    }

    return (
        <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión del {hospital[0].hospital}</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Lista de Salas y Dispositivos</h2>
          <EditarSala sala={sala} idhospital={hospitalId}/>
        </div>

        {/* Le pasamos la lista de usuarios al componente de la tabla */}
        <SalaTable sala={salas} idhospital={hospitalId} />
      </div>
    </div>
    );
}