// app/dashboard/admin/usuario/[id]/page.tsx

import Sala from "@/components/admin/sala/Sala";
import Loading from "@/components/loading/Loading";
import { Suspense } from "react";

interface UsuarioPageProps {
  params: Promise<{ id: string }>;
}

export default async function SalasPage({ params }: UsuarioPageProps) {
  const { id } = await params;
  const hospitalId = parseInt(id, 10);
  return (
    <Suspense fallback={<Loading />}>
      <Sala hospitalId={hospitalId} />
    </Suspense>
  );
}
