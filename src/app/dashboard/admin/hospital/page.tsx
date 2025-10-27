import { getHospitalAllyNumeroSalas } from "@/actions/hospital/getHospital";
import Hospital from "@/components/admin/hospital/Hospital";
import Loading from "@/components/loading/Loading";
import { Suspense } from "react";

export default async function GestionHospitalPage() {
  const hospitales = await getHospitalAllyNumeroSalas();
  return (
    <Suspense fallback={<Loading />}>
      <Hospital hospitales={hospitales} />
    </Suspense>
  );
}