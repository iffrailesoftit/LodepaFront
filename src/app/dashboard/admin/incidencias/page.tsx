import IncidenciasTableContent from "@/components/admin/incidencias/IncidenciasTableContent";

import { getSession } from "@/actions/auth/getSession";
import { redirect } from "next/navigation";

export default async function IncidenciasPage() {
  const userSession = await getSession();
  if (![1, 4].includes(userSession.rol)) {
    redirect("/dashboard");
  }

  return (
    <main className="mt-4 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Panel de Incidencias
        </h1>
      </div>

      <IncidenciasTableContent />
    </main>
  );
}
