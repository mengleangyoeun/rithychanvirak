"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navLinks = [
    { href: "/gallery", label: "Gallery" },
    { href: "/videos", label: "Videos" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  // Detect scroll state with IntersectionObserver
  useEffect(() => {
    // On non-homepage, always show scrolled state
    if (pathname !== '/') {
      setIsScrolled(true)
      return
    }

    // On homepage, use IntersectionObserver to detect hero section
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: "-80px 0px 0px 0px" // Trigger slightly before hero leaves viewport
      }
    )

    const heroSection = document.querySelector('section')
    if (heroSection) {
      observer.observe(heroSection)
    }

    return () => observer.disconnect()
  }, [pathname])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen])

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-transparent transition-[background-color,backdrop-filter,box-shadow,border-bottom-color] duration-500 ease-out will-change-[background-color,backdrop-filter]",
        isScrolled ? "nav-scrolled" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className={cn(
          "flex items-center justify-between transition-[height,gap] duration-500 ease-out",
          isScrolled ? "h-16" : "h-20"
        )}>
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "text-white font-bold hover:opacity-80 transition-[font-size,opacity] duration-500 ease-out uppercase tracking-[0.3em] sm:tracking-[0.5em]",
              isScrolled ? "text-sm sm:text-base md:text-lg" : "text-base sm:text-lg md:text-xl lg:text-2xl"
            )}
            style={{ fontFamily: "var(--font-livvic), sans-serif" }}
            aria-label="Rithy Chanvirak - Home"
          >
            <span className="hidden sm:inline">RITHY CHANVIRAK</span>
            <span className="sm:hidden">R. CHANVIRAK</span>
          </Link>

          {/* Desktop Navigation */}
          <div className={cn(
            "hidden md:flex items-center transition-[gap] duration-500 ease-out",
            isScrolled ? "gap-6" : "gap-8"
          )}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-medium tracking-wide transition-[font-size,color] duration-300 ease-out relative group",
                  isScrolled ? "text-sm" : "text-base",
                  pathname === link.href
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                )}
                style={{ fontFamily: "var(--font-livvic), sans-serif" }}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-white transition-[width] duration-300 ease-out",
                    pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            ))}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 transition-colors"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-black/95 backdrop-blur-xl border-l border-white/10 w-[280px] sm:w-[320px]"
            >
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <nav className="flex flex-col gap-6 mt-16">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "text-lg font-medium transition-[color,padding-left] duration-300 ease-out py-2",
                      pathname === link.href
                        ? "text-white border-l-2 border-white pl-4"
                        : "text-white/70 hover:text-white pl-4 hover:pl-6"
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