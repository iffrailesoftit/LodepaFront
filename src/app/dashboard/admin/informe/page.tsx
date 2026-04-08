import Informe from "@/components/admin/informe/Informe";

import { getSession } from "@/actions/auth/getSession";
import { redirect } from "next/navigation";

export default async function AdminInformePage() {
  const userSession = await getSession();
  if (![1, 2].includes(userSession.rol)) {
    redirect("/dashboard");
  }

  return (
        <Informe />
    );
}