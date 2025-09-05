"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/navigation"
import { Footer } from "@/components/footer"

export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isStudioRoute = pathname?.startsWith('/studio')

  if (isStudioRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}