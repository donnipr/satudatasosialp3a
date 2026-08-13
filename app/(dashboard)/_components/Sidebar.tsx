'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings, HeartHandshake, ChevronsLeft, Menu } from 'lucide-react'

export function Sidebar({ role, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: { role: string; isCollapsed: boolean; setIsCollapsed: (val: boolean) => void; isMobileOpen: boolean; setIsMobileOpen: (val: boolean) => void }) {
  const pathname = usePathname()

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Rekap DTSEN',
      href: '/dashboard/dtsen',
      icon: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>
      )
    },
    {
      title: 'Bantuan Sosial',
      href: '/dashboard/bantuan-sosial',
      icon: HeartHandshake
    },
    {
      title: 'Peta GIS',
      href: '/dashboard/map',
      icon: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
      )
    },
    {
      title: 'Manajemen Pengguna',
      href: '/dashboard/users',
      icon: Users
    }
  ]

  if (role === 'IAM & ADMIN') {
    navItems.push({
      title: 'Pengaturan',
      href: '/dashboard/settings',
      icon: Settings
    })
  }

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out
      ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
      md:relative md:translate-x-0 ${isCollapsed ? 'md:w-20' : 'md:w-64'}
    `}>
      
      {/* Sidebar Header (Logo & Toggle) */}
      <div className="h-16 flex items-center justify-between px-4 flex-shrink-0 bg-red-900 text-white shadow-md z-30">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
          {/* Logo Placeholder */}
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-red-900 font-bold text-xs flex-shrink-0">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-wide whitespace-nowrap">SATU DATA</span>
            <span className="text-[9px] leading-tight text-white/90 font-medium tracking-wider whitespace-nowrap">
              DINAS SOSIAL P3A
            </span>
            <span className="text-[9px] leading-tight text-white/90 font-medium tracking-wider whitespace-nowrap">
              KABUPATEN GUNUNGKIDUL
            </span>
          </div>
        </div>

        {/* When collapsed, center the 'S' or the menu button */}
        {isCollapsed && (
            <div className="w-full flex justify-center">
              <button 
                onClick={() => setIsCollapsed(false)}
                className="p-1.5 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition hidden md:flex items-center justify-center"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
        )}
        
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition hidden md:block"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={`py-6 space-y-1 flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center rounded-lg font-medium transition-all duration-300 ${
                isCollapsed ? 'justify-center p-3' : 'px-3 py-2 space-x-3'
              } ${
                isActive
                ? 'bg-red-50 text-red-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
