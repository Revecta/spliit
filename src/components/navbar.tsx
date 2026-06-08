import { UserCircle, LayoutDashboard, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { LocaleSwitcher } from '@/components/locale-switcher'

export function Navbar({ isIt }: { isIt: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-4 backdrop-blur-xl bg-black/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary/90 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:bg-primary transition-all">
            C
          </div>
          <span className="font-bold text-white hidden sm:block tracking-tight">CodiceAmico <span className="font-light text-xs text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full ml-1 align-middle">Spese</span></span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/groups" className="text-white/80 hover:text-white transition-colors py-2">
            {isIt ? 'Gruppi' : 'Groups'}
          </Link>
          <Link href="/budget" className="text-white/80 hover:text-white transition-colors py-2">
            {isIt ? 'Budget Personale' : 'Personal Budget'}
          </Link>
        </div>

        {/* Auth Actions & Locale */}
        <div className="hidden md:flex items-center gap-4 min-w-[120px] justify-end">
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
  )
}
