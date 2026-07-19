import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LayoutDashboard, Users as UsersIcon, Building2, Briefcase, CheckSquare, Shield, Search, LogOut, RotateCcw, BarChart3, Package, Megaphone, Share2 as Facebook, Camera as InstagramIcon, CreditCard, Wallet, FileText, CalendarClock, Mail } from 'lucide-react'
import { useCrmStore } from './lib/store'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Dashboard from './views/Dashboard'
import Reports from './views/Reports'
import { Contacts, Companies, Opportunities, Tasks, UsersView, Products, Marketing } from './views/Records'
import { Meta, Instagram, Payments, PaymentSettings, Invoicing, Booking } from './views/Integrations'
import { Settings } from './views/Settings'
import { Button, inputCls } from './components/ui'

const NAV = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    group: 'CRM',
    items: [
      { id: 'contacts', label: 'Contacts', icon: UsersIcon },
      { id: 'companies', label: 'Companies', icon: Building2 },
      { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    ],
  },
  {
    group: 'Commerce',
    items: [
      { id: 'products', label: 'Products & Services', icon: Package },
      { id: 'marketing', label: 'Social posts', icon: Megaphone },
    ],
  },
  {
    group: 'Integrations',
    items: [
      { id: 'meta', label: 'Meta', icon: Facebook },
      { id: 'instagram', label: 'Instagram', icon: InstagramIcon },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'paymentSettings', label: 'Payment settings', icon: Wallet },
      { id: 'invoicing', label: 'Invoicing', icon: FileText },
      { id: 'booking', label: 'Booking calendar', icon: CalendarClock },
    ],
  },
  {
    group: 'Admin',
    items: [
      { id: 'users', label: 'Users', icon: Shield },
      { id: 'settings', label: 'Email settings', icon: Mail },
    ],
  },
]

function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const data = new FormData(e.currentTarget)
    const email = data.get('email')
    const password = data.get('password')
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, data.get('fullName'), data.get('orgName'))
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">Vine CRM</p>
        <h1 id="login-title" className="mt-1 text-xl font-bold text-ink">
          {mode === 'signin' ? 'Welcome back' : 'Create your workspace'}
        </h1>
        <p className="mt-1 text-[13px] text-mute">
          {mode === 'signin'
            ? 'Sign in to manage your pipeline, contacts, and follow-ups.'
            : 'Set up your organization to start managing your pipeline.'}
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label className="flex flex-col gap-1 text-[13px] font-medium text-ink-2">
                Full name
                <input name="fullName" type="text" autoComplete="name" required className={inputCls} />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium text-ink-2">
                Organization name
                <input name="orgName" type="text" required className={inputCls} />
              </label>
            </>
          )}
          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink-2">
            Email
            <input name="email" type="email" autoComplete="email" required className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink-2">
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              className={inputCls}
            />
          </label>
          <Button type="submit" className="w-full justify-center" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
          <div role="status" aria-live="polite" className="min-h-5 text-center text-xs text-danger">{error}</div>
        </form>
        <button
          type="button"
          className="mt-2 w-full text-center text-xs font-medium text-primary hover:underline"
          onClick={() => {
            setError('')
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
          }}
        >
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

function AuthedApp() {
  const [state, api] = useCrmStore()
  const { user, org, signOut } = useAuth()
  const [view, setView] = useState('dashboard')
  const [search, setSearch] = useState('')
  const displayName = user?.user_metadata?.full_name || user?.email || 'User'

  const views = {
    dashboard: <Dashboard state={state} />,
    reports: <Reports state={state} />,
    contacts: <Contacts state={state} api={api} search={search} />,
    companies: <Companies state={state} api={api} search={search} />,
    opportunities: <Opportunities state={state} api={api} search={search} />,
    tasks: <Tasks state={state} api={api} search={search} />,
    products: <Products state={state} api={api} search={search} />,
    marketing: <Marketing state={state} api={api} search={search} />,
    users: <UsersView state={state} />,
    meta: <Meta state={state} api={api} />,
    instagram: <Instagram state={state} api={api} />,
    payments: <Payments state={state} api={api} />,
    paymentSettings: <PaymentSettings state={state} api={api} />,
    invoicing: <Invoicing state={state} api={api} />,
    booking: <Booking state={state} api={api} />,
    settings: <Settings state={state} api={api} />,
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-line bg-card md:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">V</span>
          <span className="text-[15px] font-bold text-ink">Vine<span className="text-primary">CRM</span></span>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">{group.group}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = view === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        active ? 'bg-primary-soft font-semibold text-primary' : 'text-ink-2 hover:bg-slate-100'
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" aria-hidden="true" />}
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={() => confirm('Reset all data back to the sample dataset? Everything you added will be permanently deleted.') && api.reset()}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset sample data
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-line bg-card px-4 sm:px-6">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search records"
              placeholder="Search contacts, companies, deals, tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} w-full !pl-9`}
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[13px] text-ink-2 sm:block">
              {displayName} · {org.role} · {org.name}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6">
          <div className="mb-5 md:hidden">
            <select className={inputCls} value={view} onChange={(e) => setView(e.target.value)} aria-label="Navigate">
              {NAV.flatMap((g) => g.items).map((i) => (
                <option key={i.id} value={i.id}>{i.label}</option>
              ))}
            </select>
          </div>
          {view === 'dashboard' && (
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
              <p className="text-[13px] text-mute">Your pipeline, follow-ups, and customer activity at a glance.</p>
            </div>
          )}
          {views[view]}
        </main>
      </div>
    </div>
  )
}

function AppGate() {
  const { session, org, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p className="text-[13px] text-mute">Loading…</p>
      </div>
    )
  }

  if (!session || !org) return <Login />

  return <AuthedApp />
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </QueryClientProvider>
  )
}
