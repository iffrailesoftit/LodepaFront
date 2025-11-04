import { getAccionesPurificador, getPurificador , Purificador, accionPurificador } from "@/actions/purificadores/getPurificador";
import { DataTable } from "@/components/general/DataTable";

//import dynamic from "next/dynamic";

// Carga dinámica del componente Submenu para deshabilitar SSR
//const Submenu = dynamic(() => import('@/components/dispositivo/SubMenu/SubMenu'), { ssr: false });

export default async function PurificadorPage({ params }: any) {
  const { purificador } = params;
  const puri = await getPurificador(purificador);
  const acciones = await getAccionesPurificador(purificador);
  // console.log(disp);


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Detalles del Purificador</h1>
      <DataTable<Purificador> data={[puri]} />
        <h2 className="text-xl font-bold mb-2">Acciones del Purificador</h2>
      <DataTable<accionPurificador> data={acciones} />
    </div>
  );
}
