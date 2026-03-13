import InformeForm from "./InformeForm"
import { getListadoHospitalSalas, getListadoHospitalSalasByUser, HospitalSala } from "@/actions/hospital/getListado"
import { getSession } from "@/actions/auth/getSession"

export default async function Informe() {

    const user = await getSession();
    console.log(user)
    const data: HospitalSala[] = (await getListadoHospitalSalasByUser(user.id, user.rol)) ?? []

    return (
        <InformeForm data={data} />
    )
}