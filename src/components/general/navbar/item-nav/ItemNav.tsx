"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ItemNavProps {
  href: string
  children: React.ReactNode
  className?: string
  download?: boolean
  target?: string
}

export const ItemNav = ({ href, children, className, download, target }: ItemNavProps) => {
  const pathname = usePathname();

  const baseClasses = `${className} px-4 py-2 rounded-md transition-all ${pathname === href
    ? "bg-blue-100 text-blue-700 font-medium"
    : "text-gray-700 hover:bg-gray-100"
    }`;

  if (download) {
    return (
      <a
        href={href}
        download={download}
        target={target}
        className={baseClasses}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={baseClasses}
    >
      {children}
    </Link>
  )
}


