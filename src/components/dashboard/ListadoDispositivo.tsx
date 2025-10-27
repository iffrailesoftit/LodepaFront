import CollapsibleTree from "./Collapsible"
import { getSession } from "@/actions/auth/getSession";
import { getHospitalAll, getHospitalByUser } from "@/actions/hospital/getHospital";

const ListadoDispositivo = async () => {
  
  const userSession = await getSession()
  const { id,rol } = userSession  
  // const data = await getListado(id,rol);
  let data;

  // CONTROL DE PERMISOS
  if(rol ===1){
    data = await getHospitalAll();
  }else{
    data = await getHospitalByUser(id);
  }

  return (
    <CollapsibleTree hospitals={data} id={id} rol={rol}/>
  )
}

export default ListadoDispositivo
