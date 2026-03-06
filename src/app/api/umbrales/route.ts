import { NextResponse } from "next/server";
import { getUmbrales } from "@/actions/alerta/getAlertaParametros";
// import { getSession } from "@/actions/auth/getSession";

export async function GET(request: Request) {
    // const session = await getSession();
    // if (!session) {
    //     return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    // }

    try {
        const { searchParams } = new URL(request.url);
        const id_dispositivo = Number(searchParams.get("id_dispositivo"));

        const rows = await getUmbrales(id_dispositivo);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error al obtener umbrales:", error);
        return NextResponse.json(
            { error: "No se pudieron obtener los umbrales" },
            { status: 500 }
        );
    }
}