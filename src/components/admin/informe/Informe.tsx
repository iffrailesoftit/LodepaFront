import InformeForm from "./InformeForm"
import { getListadoHospitalSalas, HospitalSala } from "@/actions/hospital/getListado"

export default async function Informe() {

    const data: HospitalSala[] = (await getListadoHospitalSalas()) ?? []

    return (
        <InformeForm data={data} />
    )
}