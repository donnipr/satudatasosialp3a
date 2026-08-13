'use client'

import { useState } from 'react'
import { ChevronsLeft, Menu, Bell, User, LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function DashboardShell({ role, currentDate, children }: { role: string; currentDate: string; children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar (Full Height Left Column) */}
      <Sidebar 
        role={role} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Right Column (Header + Main Content) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 w-full flex items-center justify-between px-6 bg-gradient-to-r from-red-800 via-red-700 to-red-500 text-white shadow-md z-20">
          
          <div className="flex items-center">
             {/* Mobile menu button (visible only on small screens when sidebar might be hidden) */}
             <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-1.5 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition md:hidden mr-4"
              >
                <Menu className="w-5 h-5" />
              </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm hidden md:block" suppressHydrationWarning>{currentDate}</span>
            
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition cursor-pointer">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition cursor-pointer">
                <User className="w-5 h-5" />
              </button>
              
              {/* Vertical Divider */}
              <div className="w-px h-6 bg-white/30 mx-1"></div>

              {/* Logout Button */}
              <form action="/auth/signout" method="post">
                <button 
                  type="submit"
                  className="flex-shrink-0 p-2 text-white/80 hover:text-white transition-colors bg-transparent hover:bg-white/20 rounded-full" 
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5"/>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {children}
        </main>

      </div>
    </div>
  )
}
