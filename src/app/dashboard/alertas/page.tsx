import { getSession } from "@/actions/auth/getSession";
import { getHospitalAll, getHospitalByUser } from "@/actions/hospital/getHospital";
import { getSalaAll, getSalaByUser } from "@/actions/hospital/sala/getSala";
import AlertaMenu from "@/components/alerta/alerta-menu/AlertaMenu";

export default async function AlertaPage() {
  const user = await getSession();
  let hospitales;
  let salas;
  if (user.rol!==1) {
    hospitales = await getHospitalByUser(user.id)
    salas = await getSalaByUser(user.id)
  }else{
    hospitales = await getHospitalAll()
    salas = await getSalaAll()
  }
  
  
  return (
    <div className="container mx-auto px-4 py-3 flex flex-col">
      <h2 className="text-xl font-semibold text-gray-700">Alertas</h2>
      <AlertaMenu userId={user.id} hospitales={hospitales} salas={salas} rol={user.rol} />
    </div>
  );
}