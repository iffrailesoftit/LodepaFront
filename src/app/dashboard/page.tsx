import ListadoDispositivo from "@/components/dashboard/ListadoDispositivo";
import Loading from "@/components/loading/Loading";
import { Suspense } from "react";
export default async function DashboardPage() {
  return (
    <main>
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mt-6 mb-6">Lista de Dispositivos</h1>
      <Suspense fallback={<Loading/>}>     
      <ListadoDispositivo /> 
      </Suspense>
    </main>
  );
}