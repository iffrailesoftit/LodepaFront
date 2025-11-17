// app/dashboard/admin/usuario/[id]/page.tsx

import { getHospitalAll } from "@/actions/hospital/getHospital";
import { getRolAll } from "@/actions/usuario/getRol";
import type { Usuario } from "@/actions/usuario/getUsuario";
import EditarUsuario from "@/components/admin/usuario/formulario/EditarUsuario";
import Loading from "@/components/loading/Loading";
import { Suspense } from "react";



export default async function UsuarioPageCrear() {

    const hosp = await getHospitalAll();
    const rol = await getRolAll();
    const user: Usuario = {
        id: 0,
        apellido: "",
        email: "",
        nombre: "",
        telefono: "",
        password: "",
        fecha_baja: null,
        rol: { id: 0, rol: "" },
        hospitales: [],
    }

    return (
        <Suspense fallback={<Loading />}>
            <EditarUsuario user={user} hospitales={hosp} roles={rol} />
        </Suspense>
    );
}
