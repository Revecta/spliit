'use client'

import { useState } from 'react'
import { usePersonalExpenses, PersonalExpense } from '@/lib/usePersonalExpenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, Wallet, TrendingUp, PiggyBank, Sparkles, AlertCircle, Calendar, Tag, ShieldCheck } from 'lucide-react'

const CATEGORIES = [
  { id: 'cibo', name: 'Spesa/Cibo', icon: '🛒', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  { id: 'trasporti', name: 'Auto/Trasporti', icon: '🚗', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  { id: 'casa', name: 'Casa/Affitto', icon: '🏠', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  { id: 'svago', name: 'Svago', icon: '🍿', color: '#8b5cf6', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
  { id: 'bollette', name: 'Bollette', icon: '⚡', color: '#ec4899', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
  { id: 'abbonamenti', name: 'Abbonamenti', icon: '👛', color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
]

export default function BudgetPage() {
  const { expenses, monthlyLimit, loading, updateMonthlyLimit, addExpense, deleteExpense, user } = usePersonalExpenses()
  
  // Add Expense form state
  const [title, setTitle] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].name)
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  
  // Edit limit state
  const [limitStr, setLimitStr] = useState((monthlyLimit / 100).toString())
  const [isEditingLimit, setIsEditingLimit] = useState(false)

  // Shortcuts integration state
  const [shortcutsToken, setShortcutsToken] = useState<string | null>(null)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateToken = async () => {
    setGeneratingToken(true)
    try {
      const response = await fetch('/api/personal/token')
      const data = (await response.json()) as { token?: string }
      if (data.token) {
        setShortcutsToken(data.token)
      } else {
        alert('Errore nella generazione del token.')
      }
    } catch (e) {
      console.error(e)
      alert('Errore di connessione durante la generazione del token.')
    } finally {
      setGeneratingToken(false)
    }
  }

  // Math variables
  const now = new Date()
  const currentMonthStr = now.toISOString().slice(0, 7) // YYYY-MM
  
  const currentMonthExpenses = expenses.filter(exp => exp.expenseDate.startsWith(currentMonthStr))
  const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalSpentDecimal = totalSpent / 100
  const monthlyLimitDecimal = monthlyLimit / 100
  const percentageUsed = monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0
  const isLimitExceeded = totalSpent > monthlyLimit

  // Calculate totals by category
  const categoryTotals = CATEGORIES.map(cat => {
    const total = currentMonthExpenses
      .filter(exp => exp.category === cat.name)
      .reduce((sum, exp) => sum + exp.amount, 0)
    return { ...cat, total }
  }).filter(cat => cat.total > 0)

  // Handle new expense submission
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amountStr) return

    const amountFloat = parseFloat(amountStr.replace(',', '.'))
    if (isNaN(amountFloat) || amountFloat <= 0) return

    const amountCents = Math.round(amountFloat * 100)
    
    await addExpense({
      title: title.trim(),
      amount: amountCents,
      category,
      expenseDate,
    })

    setTitle('')
    setAmountStr('')
  }

  // Handle updating budget limit
  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    const limitFloat = parseFloat(limitStr.replace(',', '.'))
    if (isNaN(limitFloat) || limitFloat <= 0) return

    const limitCents = Math.round(limitFloat * 100)
    await updateMonthlyLimit(limitCents)
    setIsEditingLimit(false)
  }

  // SVG Donut Chart Logic
  const renderDonutChart = () => {
    if (categoryTotals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
          <PiggyBank className="w-12 h-12 mb-2 stroke-[1.5] text-zinc-700" />
          <span className="text-sm font-semibold tracking-wide uppercase text-zinc-500">Nessuna Spesa</span>
        </div>
      )
    }

    const radius = 32
    const strokeWidth = 6
    const circumference = 2 * Math.PI * radius
    let accumulatedPercent = 0

    return (
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeWidth} />
          {categoryTotals.map((cat) => {
            const percent = (cat.total / totalSpent) * 100
            const strokeLength = (percent / 100) * circumference
            const strokeOffset = circumference - (accumulatedPercent / 100) * circumference
            accumulatedPercent += percent

            return (
              <circle
                key={cat.id}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500 cursor-pointer hover:stroke-[7]"
              />
            )
          })}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Totale Speso</span>
          <span className="text-3xl font-black text-white italic tracking-tight">{totalSpentDecimal.toFixed(2)}€</span>
          <span className="text-zinc-400 text-xs font-semibold mt-0.5">di {monthlyLimitDecimal.toFixed(0)}€</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Caricamento in corso...</span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Premium Ambient Background Blobs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-blob pointer-events-none z-[-1]" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000 pointer-events-none z-[-1]" />

      <main className="container max-w-6xl mx-auto px-4 py-8 flex-1 relative">
        {/* Title & Sync Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
              <span className="text-gradient">Budget Personale</span>
              <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl leading-relaxed">
              Traccia le tue uscite individuali e gestisci i limiti di spesa personali con l'interfaccia premium di CodiceAmico.
            </p>
          </div>
          
          {/* Connection status tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest glass border-white/10 select-none">
            <div className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]'}`} />
            <span className="text-zinc-300">
              {user ? (
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-blue-500" /> Sincronizzato: {user.email}
                </span>
              ) : (
                'Anonimo (Salvataggio Locale)'
              )}
            </span>
          </div>
        </div>

        {/* Grid of Budget limit card + Chart card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Monthly limit & Progress */}
          <Card className="glass-card md:col-span-2 relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black text-white/45 uppercase tracking-widest">Stato Budget Mensile</h4>
                  <CardTitle className="text-white text-xl font-black italic uppercase tracking-tight mt-1">
                    {now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingLimit ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-white/5 border border-white/5 rounded-xl px-3 py-1"
                      onClick={() => {
                        setLimitStr((monthlyLimit / 100).toString())
                        setIsEditingLimit(true)
                      }}
                    >
                      Modifica Limite
                    </Button>
                  ) : (
                    <form onSubmit={handleUpdateLimit} className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={limitStr}
                        onChange={e => setLimitStr(e.target.value)}
                        className="w-20 h-8 text-center bg-white/5 border-white/10 text-white rounded-lg focus:ring-1 focus:ring-blue-500 text-xs font-bold"
                      />
                      <Button type="submit" size="sm" className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg px-3">
                        Salva
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-zinc-400 hover:bg-white/5 text-xs font-bold"
                        onClick={() => setIsEditingLimit(false)}
                      >
                        Annulla
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-3xl font-black text-white italic tracking-tight">
                  {totalSpentDecimal.toFixed(2)}€
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-2">spesi</span>
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Tetto: <span className="text-white font-black">{monthlyLimitDecimal.toFixed(0)}€</span>
                </span>
              </div>

              {/* Premium Progress Bar */}
              <div className="w-full bg-white/5 border border-white/10 rounded-full h-4 overflow-hidden relative backdrop-blur-sm mb-4">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    percentageUsed >= 90 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_15px_rgba(239,68,68,0.7)]' 
                      : percentageUsed >= 70 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.6)]' 
                      : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                  }`}
                  style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className={isLimitExceeded ? "text-red-400" : "text-zinc-500"}>
                  {percentageUsed.toFixed(0)}% del budget utilizzato
                </span>
                
                {isLimitExceeded ? (
                  <span className="flex items-center gap-1 text-red-400 font-black animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Limite Superato!
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    {(monthlyLimitDecimal - totalSpentDecimal).toFixed(2)}€ disponibili
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories Distribution Donut Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <h4 className="text-xs font-black text-white/45 uppercase tracking-widest">Distribuzione Spese</h4>
              <CardTitle className="text-white text-md font-black italic uppercase tracking-tight mt-1">Ripartizione</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-4">
              {renderDonutChart()}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form to Add Expense */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  Nuova Spesa
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Inserisci una spesa per aggiornare il tuo bilancio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitExpense} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Titolo</label>
                    <Input
                      type="text"
                      required
                      placeholder="Generi alimentari, Benzina, Svago..."
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="bg-white/3 border-white/5 text-white rounded-xl placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/35 h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Importo (€)</label>
                      <Input
                        type="text"
                        required
                        placeholder="12.50"
                        value={amountStr}
                        onChange={e => setAmountStr(e.target.value)}
                        className="bg-white/3 border-white/5 text-white rounded-xl placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/35 h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Data</label>
                      <Input
                        type="date"
                        required
                        value={expenseDate}
                        onChange={e => setExpenseDate(e.target.value)}
                        className="bg-white/3 border-white/5 text-white rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/35 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Categoria</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full h-11 px-3 bg-[#030303] border border-white/5 rounded-xl text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/35 focus:outline-none text-sm font-semibold"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl py-6 tracking-wide uppercase italic shadow-[0_0_25px_rgba(59,130,246,0.45)] border border-blue-500/35 transition-all hover:scale-[1.01] mt-2">
                    Registra Spesa
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Category distribution details list */}
            {categoryTotals.length > 0 && (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <h4 className="text-xs font-black text-white/45 uppercase tracking-widest">Riepilogo Categorie</h4>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {categoryTotals.map(cat => {
                    const percent = ((cat.total / totalSpent) * 100).toFixed(0)
                    return (
                      <div key={cat.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${cat.bg} ${cat.border} ${cat.text}`}>
                            {cat.icon} {cat.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-black italic">{(cat.total / 100).toFixed(2)}€</span>
                          <span className="text-zinc-500 text-[10px] font-bold block">{percent}%</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Apple Shortcuts Integration Card */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-md font-black uppercase italic tracking-tight flex items-center gap-2">
                  <span className="text-gradient">Automazione Wallet</span>
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Registra le spese all'istante con Apple Pay.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {!user ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400 leading-relaxed">
                    <span className="font-bold uppercase tracking-wider block mb-1">Non Sincronizzato</span>
                    Esegui il login su CodiceAmico per abilitare la sincronizzazione e generare il tuo token API privato per Apple Shortcuts.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Genera il tuo token API personale da inserire all'interno dell'automazione di iOS.
                    </p>
                    
                    {shortcutsToken ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2 rounded-lg text-xs font-mono text-zinc-300 break-all select-all">
                          <span className="flex-1 overflow-hidden text-ellipsis">{shortcutsToken}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-blue-400 hover:text-blue-300 hover:bg-white/5 px-2 py-1"
                            onClick={() => {
                              navigator.clipboard.writeText(shortcutsToken)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                            }}
                          >
                            {copied ? 'Copiato!' : 'Copia'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={generatingToken}
                        className="w-full bg-blue-600/90 hover:bg-blue-600 text-white font-bold rounded-xl py-2 text-xs"
                        onClick={handleGenerateToken}
                      >
                        {generatingToken ? 'Generazione...' : 'Genera API Token'}
                      </Button>
                    )}

                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest block mb-2">Istruzioni Setup iOS</span>
                      <ol className="text-[10px] text-zinc-500 space-y-1.5 list-decimal list-inside font-medium leading-relaxed">
                        <li>Crea un'Automazione in <strong className="text-zinc-400">Comandi Rapidi</strong> su iPhone.</li>
                        <li>Scegli come trigger <strong className="text-zinc-400">Transazione Wallet</strong> (Apple Pay).</li>
                        <li>Imposta un'azione <strong className="text-zinc-400">Scegli dal menu</strong> per catturare la categoria.</li>
                        <li>Invia una richiesta <strong className="text-zinc-400">HTTP POST</strong> all'indirizzo:
                          <code className="block mt-1 p-1 bg-black/40 border border-white/5 rounded text-[9px] font-mono text-zinc-400 overflow-x-auto select-all">
                            https://spese.codiceamico.app/api/personal/expense
                          </code>
                        </li>
                        <li>Aggiungi l'header:
                          <code className="block mt-1 p-1 bg-black/40 border border-white/5 rounded text-[9px] font-mono text-zinc-400 select-all">
                            Authorization: Bearer [tuo_token]
                          </code>
                        </li>
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (2 spans wide): List of Expenses */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="text-white text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-500" />
                  Storico Uscite
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Uscite ordinate per data di registrazione.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                    <TrendingUp className="w-12 h-12 mb-3 text-zinc-700 stroke-[1.5]" />
                    <p className="text-sm font-semibold tracking-wide uppercase text-zinc-600">Nessuna transazione</p>
                    <p className="text-xs text-zinc-500 mt-1">Inserisci le tue transazioni a sinistra.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 space-y-4">
                    {expenses.map(exp => {
                      const categoryObj = CATEGORIES.find(c => c.name === exp.category) || {
                        icon: '💸',
                        bg: 'bg-zinc-500/10',
                        border: 'border-zinc-500/20',
                        text: 'text-zinc-400'
                      }

                      return (
                        <div key={exp.id} className="flex items-center justify-between pt-4 first:pt-0 group">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${categoryObj.bg} ${categoryObj.border} ${categoryObj.text} flex items-center gap-1`}>
                                {categoryObj.icon}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white leading-none">{exp.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                                  {new Date(exp.expenseDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Tag className="w-3.5 h-3.5 text-zinc-600" />
                                  {exp.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-md font-extrabold text-white italic">
                              {(exp.amount / 100).toFixed(2)}€
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteExpense(exp.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
