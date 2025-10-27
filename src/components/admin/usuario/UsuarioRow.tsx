// /app/usuarios/UsuarioRow.tsx
"use client";

import React from "react";
import EliminarModal from "./formulario/EliminarModal";
import { useRouter } from 'next/navigation';
import { Pencil } from "lucide-react"
import { Usuario } from "@/actions/usuario/getUsuario";


interface UsuarioRowProps {
  usuario: Usuario;
}

export default function UsuarioRow({ usuario }: UsuarioRowProps) {
// Aquí definimos allSalas
const allSalas = usuario.hospitales.flatMap((h) => h.salas);
const router = useRouter();

const handleRedirigir = () => {
  // Puedes pasar parámetros en la URL, por ejemplo:
  router.push(`/dashboard/admin/usuario/${usuario.id}`);
};
return (
    <tr key={usuario.id} className="hover:bg-gray-50">
      <td className="border px-4 py-2 text-sm">{usuario.id}</td>
      <td className="border px-4 py-2 text-sm">{usuario.nombre}</td>
      <td className="border px-4 py-2 text-sm">{usuario.apellido}</td>
      <td className="border px-4 py-2 text-sm">{usuario.email}</td>
      {/* <td className="border px-4 py-2 text-sm">
        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{usuario.password}</span>
      </td> */}
      <td className="border px-4 py-2 text-sm">{usuario.telefono ?? "N/A"}</td>
      <td className="border px-4 py-2 text-sm">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{usuario.rol.rol}</span>
      </td>
      <td className="border px-4 py-2 text-sm">
        {usuario.hospitales.length > 0
          ? usuario.hospitales.map((h) => (
              <span
                key={h.id}
                className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1"
              >
                {h.hospital}
              </span>
            ))
          : "Ninguno"}
      </td>
      <td className="border px-4 py-2 text-sm">
        {allSalas.length > 0
          ? allSalas.map((s) => (
              <span
                key={s.id}
                className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1"
              >
                {s.n_sala}
              </span>
            ))
          : "Ninguna"}
      </td>
      <td className="border px-4 py-2 text-sm">
        {/* Botón para abrir modal de Editar */}
        <button
          onClick={handleRedirigir}
          className="bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 rounded flex items-center justify-center transition-colors"
        >
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </button>
      </td>
      <td className="border px-4 py-2 text-sm">
        {/* Botón para abrir modal de Eliminar */}
        <EliminarModal userId={usuario.id} userName={usuario.nombre} />
      </td>
    </tr>
  );
}
