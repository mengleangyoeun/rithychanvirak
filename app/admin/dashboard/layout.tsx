'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Image as ImageIcon, Video, FolderOpen, LogOut, Menu, FileText, LayoutDashboard, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'

const navItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/dashboard/collections', label: 'Albums', icon: FolderOpen },
  { href: '/admin/dashboard/photos', label: 'Photos', icon: ImageIcon },
  { href: '/admin/dashboard/videos', label: 'Videos', icon: Video },
  { href: '/admin/dashboard/content', label: 'Content', icon: FileText },
]

function SidebarContent({ pathname, userEmail, onLogout }: { pathname: string, userEmail: string | null, onLogout: () => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950/50 backdrop-blur-xl border-r border-white/10 text-zinc-300">
      {/* Brand Header */}
      <div className="p-6">
        <Link href="/admin/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-sm tracking-wider">RC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white tracking-wide uppercase">Admin Panel</span>
            <span className="text-xs text-zinc-500">Rithy Chanvirak</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-zinc-500")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 mt-auto border-t border-white/5">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white truncate max-w-[140px]">{userEmail || 'Admin'}</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/', '_blank')}
            className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg h-9"
          >
            <Globe className="w-4 h-4 mr-2" />
            <span className="text-xs">Site</span>
          </Button>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg h-9"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-xs">Exit</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 selection:bg-white/20">
      {/* Desktop Sidebar */}
      <aside className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:z-50 xl:block xl:w-72">
        <SidebarContent pathname={pathname} userEmail={userEmail} onLogout={handleLogout} />
      </aside>

      {/* Mobile Header */}
      <header suppressHydrationWarning className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md px-4 xl:hidden">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button suppressHydrationWarning variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r border-white/10 bg-zinc-950">
              <VisuallyHidden>
                <DialogTitle>Navigation Menu</DialogTitle>
              </VisuallyHidden>
              <SidebarContent pathname={pathname} userEmail={userEmail} onLogout={handleLogout} />
            </SheetContent>
          </Sheet>
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xs tracking-wider">RC</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('/', '_blank')}
            className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <Globe className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="xl:pl-72 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      <Toaster position="top-center" richColors theme="dark" />
    </div>
  )
}
