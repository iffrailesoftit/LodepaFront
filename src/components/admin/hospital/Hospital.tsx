import HospitalTable from "./HospitalTable";
import NuevoHospital from "./modals/NuevoHospital";

export default async function Hospital({hospitales}:any) {

  
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Hospitales</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Lista de Hospitales</h2>
          <NuevoHospital />
        </div>

        {/* Le pasamos la lista de usuarios al componente de la tabla */}
        <HospitalTable hospitales={hospitales} />
      </div>
    </div>
  );
}