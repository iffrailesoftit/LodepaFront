import InformeForm from "./InformeForm"
import { getListadoHospitalSalasByUser, HospitalSala } from "@/actions/hospital/getListado"
import { getSession } from "@/actions/auth/getSession"

export default async function Informe() {

    const user = await getSession();
    const data: HospitalSala[] = (await getListadoHospitalSalasByUser(user.id, user.rol)) ?? []

    return (
        <InformeForm data={data} />
    )
}