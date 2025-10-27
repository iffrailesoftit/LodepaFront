import Usuarios from "@/components/admin/usuario/Usuario";
import Loading from "@/components/loading/Loading";
import { Suspense } from "react";

export default async function GestionUsuarioPage() {

  return (
    <Suspense fallback={<Loading />}>
      <Usuarios />
    </Suspense>
  );
}