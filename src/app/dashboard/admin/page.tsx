import GestionUsuarioPage from "./usuario/page";

import { getSession } from "@/actions/auth/getSession";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const userSession = await getSession();
  if (![1, 2].includes(userSession.rol)) {
    redirect("/dashboard");
  }

  return (
    <main>
      <GestionUsuarioPage />
    </main>
  );
}