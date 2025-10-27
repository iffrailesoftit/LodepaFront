// /app/usuarios/page.tsx
import { getVerUsuarioAll } from "@/actions/usuario/getUsuario";
import UsuarioTable from "./UsuarioTable";
import Link from "next/link";

export default async function UsuariosPage() {
  // Llamada a la DB en el servidor
  const usuarios = await getVerUsuarioAll();
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Lista de Usuarios</h2>
          <Link href="/dashboard/admin/usuario/crear">
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors">
            Nuevo Usuario
          </button>
          </Link>
        </div>

        {/* Le pasamos la lista de usuarios al componente de la tabla */}
        <UsuarioTable usuarios={usuarios} />
      </div>
    </div>
  );
}
