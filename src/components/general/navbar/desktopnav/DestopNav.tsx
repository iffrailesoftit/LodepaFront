
import { logout } from "@/actions/auth/logout";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ItemNav } from "../item-nav/ItemNav";


export const DesktopNav = ({ links }: { links: any }) => {

  return (

    <div className="hidden md:flex items-center space-x-6">
      {links.map((link: any) => (
        <ItemNav key={link.name} href={link.href} className="px-4 py-2 rounded-md transition-all">
          {link.name}
        </ItemNav>
      ))}
      <Button onClick={logout} variant="destructive" className="ml-4 font-medium cursor-pointer" size="sm">
        <LogOut className=" h-4 w-4" />
        Cerrar Sesión
      </Button>
    </div>
  )
}