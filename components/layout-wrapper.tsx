"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PrefetchRoutes } from "@/components/prefetch-routes"
import { ErrorBoundary } from "@/components/error-boundary"
import { ScrollToTop } from "@/components/scroll-to-top"
import { useScrollRestoration } from "@/hooks/use-scroll-restoration"

export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isStudioRoute = pathname?.startsWith('/studio')
  const isAdminRoute = pathname?.startsWith('/admin')

  // Enable scroll restoration
  useScrollRestoration()

  // Don't show header/footer for studio or admin routes
  if (isStudioRoute || isAdminRoute) {
    return <>{children}</>
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <PrefetchRoutes />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  )
}