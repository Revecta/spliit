import Link from 'next/link'

export function Footer({ isIt }: { isIt: boolean }) {
  return (
    <footer className="border-t border-white/5 bg-black/40 backdrop-blur-md pt-16 pb-32 md:pb-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary/90 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:bg-primary transition-all">
                C
              </div>
              <span className="font-bold text-white tracking-tight">CodiceAmico <span className="font-light text-xs text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full ml-1 align-middle">Spese</span></span>
            </Link>
            <p className="text-sm text-zinc-400">
              {isIt ? 'Un\'applicazione premium per la gestione delle spese personali e di gruppo.' : 'A premium application to manage personal and group expenses.'}
            </p>
          </div>

          {/* Spacer to match layout if needed */}
          <div className="hidden md:block md:col-span-2"></div>

          {/* Legals */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Info</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <a href="https://codiceamico.app/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="https://codiceamico.app/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cookie Policy</a>
              </li>
              <li>
                <a href="https://codiceamico.app/termini-e-condizioni" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Termini di Servizio</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} spese.codiceamico.app. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
