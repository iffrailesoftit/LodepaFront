"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Building2, Menu, X } from "lucide-react"

export default function AdminMenu() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const menuItems = [
    {
      href: "/dashboard/admin",
      label: "Gestión Usuario",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/dashboard/admin/hospital",
      label: "Gestión Hospital",
      icon: <Building2 className="h-5 w-5" />,
    },
  ]

  return (
    <div className="bg-white shadow-md rounded-lg">
      {/* Versión móvil - Botón de hamburguesa */}
      <div className="md:hidden p-4 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">Panel de Administración</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
        </button>
      </div>

      {/* Menú de navegación - Responsive */}
      <nav className={`${isMobile && !isOpen ? "hidden" : "block"} p-4`}>
        <ul className="md:flex md:space-x-2 space-y-2 md:space-y-0">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 rounded-md transition-all duration-200
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span className="ml-2 bg-blue-500 rounded-full h-2 w-2"></span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

