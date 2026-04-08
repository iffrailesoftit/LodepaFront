import { getHospitalAllyNumeroSalas } from "@/actions/hospital/getHospital";
import Hospital from "@/components/admin/hospital/Hospital";
import Loading from "@/components/loading/Loading";
import { Suspense } from "react";

import { getSession } from "@/actions/auth/getSession";
import { redirect } from "next/navigation";

export default async function GestionHospitalPage() {
  const userSession = await getSession();
  if (![1, 2].includes(userSession.rol)) {
    redirect("/dashboard");
  }

  const hospitales = await getHospitalAllyNumeroSalas();
  return (
    <Suspense fallback={<Loading />}>
      <Hospital hospitales={hospitales} />
    </Suspense>
  );
}