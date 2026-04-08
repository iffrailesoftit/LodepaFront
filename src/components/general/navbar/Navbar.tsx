import { getSession } from "@/actions/auth/getSession"
import Image from "next/image"
import { DesktopNav } from "./desktopnav/DestopNav"
import { MobileNav } from "./mobile/MobileNav"

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Alertas", href: "/dashboard/alertas" },
  // { name: "Informe", href: "/dashboard/informe" },
  { name: "Manual", href: "/api/descargar-manual", download: true, target: "_blank" },
]

export default async function Navbar() {

  const userSession = await getSession()
  const { rol } = userSession

  const navLinks = [...links]

  // CONTROL DE PERMISOS
  if ([1, 2, 4].includes(rol)) {
    const href = rol === 4 ? "/dashboard/admin/incidencias" : "/dashboard/admin";
    navLinks.push({ name: "Admin", href });
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo optimizado con next/image */}
        <div className="flex items-center">
          <Image className="w-32" src="/cropped-LOGO-LODEPA-sin-fondo.png" alt="Logo" width={100} height={100} />
        </div>

        {/* Navigation */}
        <>
          <DesktopNav links={navLinks} />
          <MobileNav links={navLinks} />
        </>
      </nav>
    </div>
  )
}
