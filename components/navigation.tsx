"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navLinks = [
    { href: "/gallery", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  useEffect(() => {
    // Only use IntersectionObserver on homepage
    if (pathname === '/') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsScrolled(!entry.isIntersecting)
        },
        { threshold: 0.1 }
      )

      const heroSection = document.querySelector('section')
      if (heroSection) {
        observer.observe(heroSection)
      }

      return () => observer.disconnect()
    }
  }, [pathname])

  // Set header state based on current route
  useEffect(() => {
    if (pathname === '/') {
      setIsScrolled(false)
    } else {
      setIsScrolled(true)
    }
  }, [pathname])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header
      className={cn(
        "fixed top-0 left-0 md:w-[calc(100vw-17px)] right-0 z-50",
        isScrolled ? "nav-scrolled" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className={cn(
          "flex items-center justify-between transition-all duration-300",
          isScrolled ? "py-3" : "py-4 sm:py-6"
        )}>
          <Link
            href="/"
            className={cn(
              "text-white font-medium hover:text-white/80 transition-all duration-300 uppercase",
              "tracking-[0.5em]",
              isScrolled ? "text-sm sm:text-base" : "text-base sm:text-lg lg:text-xl"
            )}
            style={{ fontFamily: "var(--font-livvic), sans-serif" }}
            aria-label="Home"
          >
            RITHY CHANVIRAK
          </Link>

          <div className={cn(
            "hidden md:flex items-center transition-all duration-300",
            isScrolled ? "space-x-4 lg:space-x-6" : "space-x-6 lg:space-x-8"
          )}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-medium tracking-wide text-white/80 hover:text-white transition-all duration-300",
                  isScrolled ? "text-xs sm:text-sm" : "text-sm lg:text-base",
                  pathname === link.href && "text-white border-b-2 border-white"
                )}
                style={{ fontFamily: "var(--font-livvic), sans-serif" }}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-black/95 backdrop-blur-md border-l border-white/20 w-[250px]"
            >
              <nav className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "text-lg font-medium text-white/80 hover:text-white transition-colors duration-200",
                      pathname === link.href && "text-white border-l-2 border-white pl-2"
                    )}
                    style={{ fontFamily: "var(--font-livvic), sans-serif" }}
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  )
}