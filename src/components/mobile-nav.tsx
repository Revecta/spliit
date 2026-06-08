'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Plus, Wallet, Settings } from 'lucide-react'

export function MobileNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Show if scrolling up, hide if scrolling down (and scrolled at least 50px)
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      active: pathname === '/'
    },
    {
      label: 'Gruppi',
      href: '/groups',
      icon: Users,
      active: pathname.startsWith('/groups') && pathname !== '/groups/create'
    },
    {
      label: 'Nuovo',
      href: '/groups/create',
      icon: Plus,
      isCenter: true,
      active: false
    },
    {
      label: 'Budget',
      href: '/budget',
      icon: Wallet,
      active: pathname === '/budget'
    },
    {
      label: 'Impostazioni',
      href: '/groups', // Fallback for settings/groups list
      icon: Settings,
      active: false
    }
  ]

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[100] md:hidden transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      {/* Backdrop Blur & Gradient Overlay */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl border-t border-white/5" />
      
      <div className="relative flex items-center justify-between h-20 px-2 pb-safe">
        {navItems.map((item, i) => {
          const Icon = item.icon
          const content = (
            <div className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
              item.active ? 'text-primary scale-110 font-bold' : 'text-white/40 hover:text-white/60'
            }`}>
              <Icon size={22} strokeWidth={item.active ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">
                {item.label}
              </span>
              {item.active && (
                <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </div>
          )

          if (item.isCenter) {
            return (
              <Link
                key={i}
                href={item.href}
                className="relative -top-6 flex flex-col items-center justify-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform animate-glass-breathe border border-white/20 backdrop-blur-xl">
                  <Plus size={28} strokeWidth={3} />
                </div>
                <span className="absolute -bottom-6 text-[9px] font-black uppercase tracking-tighter text-white/60 group-hover:text-primary transition-colors">
                  NUOVO
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={i}
              href={item.href}
              className="flex-1 h-full flex flex-col items-center justify-center"
            >
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
