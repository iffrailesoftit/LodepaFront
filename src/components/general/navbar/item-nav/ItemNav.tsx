"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ItemNavProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const ItemNav = ({ href, children, className }: ItemNavProps) => {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={`${className} px-4 py-2 rounded-md transition-all ${pathname === href
        ? "bg-blue-100 text-blue-700 font-medium"
        : "text-gray-700 hover:bg-gray-100"
        }`}
    >
      {children}
    </Link>
  )
}


