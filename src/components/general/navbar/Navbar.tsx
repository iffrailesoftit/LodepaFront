import { getSession } from "@/actions/auth/getSession"
import Image from "next/image"
import { DesktopNav } from "./desktopnav/DestopNav"
import { MobileNav } from "./mobile/MobileNav"

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Alertas", href: "/dashboard/alertas" },
]

export default async function Navbar() {

  const userSession = await getSession()
  const { rol } = userSession

  const navLinks = [...links]

  // CONTROL DE PERMISOS
  if (rol === 1) {
    navLinks.push({ name: "Admin", href: "/dashboard/admin" })
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
