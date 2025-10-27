'use client'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LogOut, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const MobileNav = ({ links }: { links: any }) => {

  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-8" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80%] sm:w-[350px] pt-12">
        {/* Agregar título accesible pero oculto */}
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

        <div className="flex flex-col space-y-2 px-5 ">
          {links.map((link: any) => (
            <Link
              key={link.name}
              href={link.href}
              className={`px-4 py-3 rounded-md transition-all ${pathname === link.href
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {link.name}
            </Link>
          ))}
          <Button variant="destructive" className="mt-4 w-full font-medium">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
