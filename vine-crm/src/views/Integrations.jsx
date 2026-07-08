import { useEffect, useState } from 'react'
import { Share2 as Facebook, Camera as InstagramIcon, CreditCard, FileText, CalendarClock, Check, Plug, PlugZap, Wallet, Plus, Trash2 } from 'lucide-react'
import { PAYMENT_PROVIDERS, CURRENCIES } from '../lib/store'
import { Card, CardHeader, Badge, Button, Field, inputCls, Th, Td } from '../components/ui'

// Local draft form bound to a settings group; Save writes through to the store.
function useSettingsForm(state, api, group) {
  const saved = state.settings[group]
  const [draft, setDraft] = useState(saved)
  const [flash, setFlash] = useState(false)
  useEffect(() => setDraft(saved), [saved])
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const save = (activityMsg) => {
    api.updateSettings(group, draft, activityMsg)
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }
  return { draft, set, save, flash, saved }
}

function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-slate-50 text-ink-2">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="text-[13px] text-mute">{subtitle}</p>
      </div>
    </div>
  )
}

function StatusBadge({ connected }) {
  return connected ? <Badge tone="good">Connected</Badge> : <Badge tone="neutral">Not connected</Badge>
}

function SaveButton({ flash, onClick, children = 'Save changes' }) {
  return (
    <Button onClick={onClick}>
      {flash ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {flash ? 'Saved' : children}
    </Button>
  )
}

function ConnectToggle({ connected, onToggle, label }) {
  return (
    <Button variant={connected ? 'outline' : 'primary'} onClick={onToggle}>
      {connected ? <PlugZap className="h-3.5 w-3.5" aria-hidden="true" /> : <Plug className="h-3.5 w-3.5" aria-hidden="true" />}
      {connected ? `Disconnect ${label}` : `Connect ${label}`}
    </Button>
  )
}

// ---------- Meta (Facebook) ----------
export function Meta({ state, api }) {
  const { draft, set, save, flash } = useSettingsForm(state, api, 'meta')
  const toggle = () =>
    api.updateSettings('meta', { connected: !draft.connected }, draft.connected ? 'Disconnected Meta' : 'Connected Meta')
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={Facebook} title="Meta" subtitle="Connect your Facebook Page to sync leads and publish posts." />
      <Card>
        <CardHeader title="Facebook Page" action={<StatusBadge connected={draft.connected} />} />
        <div className="space-y-4 p-5">
          <ConnectToggle connected={draft.connected} onToggle={toggle} label="Facebook" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Page name">
              <input className={inputCls} value={draft.pageName} onChange={(e) => set({ pageName: e.target.value })} placeholder="The Vine Solutions" />
            </Field>
            <Field label="Page ID">
              <input className={inputCls} value={draft.pageId} onChange={(e) => set({ pageId: e.target.value })} placeholder="1029384756" />
            </Field>
          </div>
          <Field label="Access token">
            <input className={inputCls} type="password" value={draft.accessToken} onChange={(e) => set({ accessToken: e.target.value })} placeholder="EAAB…" />
          </Field>
          <div className="flex justify-end">
            <SaveButton flash={flash} onClick={() => save()} />
          </div>
        </div>
      </Card>
      <PreviewCard title="Connected page preview">
        {draft.connected ? (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] text-white"><Facebook className="h-5 w-5" /></span>
            <div>
              <p className="text-[13px] font-semibold text-ink">{draft.pageName || 'Untitled Page'}</p>
              <p className="text-xs text-mute">Page ID {draft.pageId || '—'} · 12.4k followers</p>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-mute">Connect a Facebook Page to see its details here.</p>
        )}
      </PreviewCard>
    </div>
  )
}

// ---------- Instagram ----------
export function Instagram({ state, api }) {
  const { draft, set, save, flash } = useSettingsForm(state, api, 'instagram')
  const toggle = () =>
    api.updateSettings('instagram', { connected: !draft.connected }, draft.connected ? 'Disconnected Instagram' : 'Connected Instagram')
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={InstagramIcon} title="Instagram" subtitle="Link an Instagram Business account to schedule and publish content." />
      <Card>
        <CardHeader title="Instagram account" action={<StatusBadge connected={draft.connected} />} />
        <div className="space-y-4 p-5">
          <ConnectToggle connected={draft.connected} onToggle={toggle} label="Instagram" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Handle">
              <input className={inputCls} value={draft.handle} onChange={(e) => set({ handle: e.target.value.replace(/^@/, '') })} placeholder="thevinesolutions" />
            </Field>
            <Field label="Business account ID">
              <input className={inputCls} value={draft.accountId} onChange={(e) => set({ accountId: e.target.value })} placeholder="17841400000000000" />
            </Field>
          </div>
          <Field label="Access token">
            <input className={inputCls} type="password" value={draft.accessToken} onChange={(e) => set({ accessToken: e.target.value })} placeholder="IGQVJ…" />
          </Field>
          <div className="flex justify-end">
            <SaveButton flash={flash} onClick={() => save()} />
          </div>
        </div>
      </Card>
      <PreviewCard title="Account preview">
        {draft.connected ? (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white"><InstagramIcon className="h-5 w-5" /></span>
            <div>
              <p className="text-[13px] font-semibold text-ink">@{draft.handle || 'your_handle'}</p>
              <p className="text-xs text-mute">Business account · 8.1k followers · 214 posts</p>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-mute">Connect an Instagram account to see its profile here.</p>
        )}
      </PreviewCard>
    </div>
  )
}

// ---------- Payments ----------
export function Payments({ state, api }) {
  const { draft, set, save, flash } = useSettingsForm(state, api, 'payments')
  const toggle = () =>
    api.updateSettings('payments', { connected: !draft.connected }, draft.connected ? 'Disconnected payments' : `Connected ${draft.provider}`)
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={CreditCard} title="Payment Solutions" subtitle="Accept card and online payments through your chosen provider." />
      <Card>
        <CardHeader title="Payment provider" action={<StatusBadge connected={draft.connected} />} />
        <div className="space-y-4 p-5">
          <ConnectToggle connected={draft.connected} onToggle={toggle} label={draft.provider} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider">
              <select className={inputCls} value={draft.provider} onChange={(e) => set({ provider: e.target.value })}>
                {PAYMENT_PROVIDERS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Default currency">
              <select className={inputCls} value={draft.currency} onChange={(e) => set({ currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Publishable key">
            <input className={inputCls} value={draft.publishableKey} onChange={(e) => set({ publishableKey: e.target.value })} placeholder="pk_live_…" />
          </Field>
          <Field label="Secret key">
            <input className={inputCls} type="password" value={draft.secretKey} onChange={(e) => set({ secretKey: e.target.value })} placeholder="sk_live_…" />
          </Field>
          <div className="flex justify-end">
            <SaveButton flash={flash} onClick={() => save()} />
          </div>
        </div>
      </Card>
      <PreviewCard title="Checkout preview">
        {draft.connected ? (
          <p className="text-[13px] text-ink-2">
            Payments enabled via <span className="font-semibold text-ink">{draft.provider}</span> · settling in{' '}
            <span className="font-semibold text-ink">{draft.currency}</span>. Customers can pay invoices online.
          </p>
        ) : (
          <p className="text-[13px] text-mute">Connect a provider to start accepting payments.</p>
        )}
      </PreviewCard>
    </div>
  )
}

// ---------- Payment settings (plans) ----------
const INTERVALS = ['month', 'year', 'week', 'one-time']
const emptyPlan = { name: '', price: '', interval: 'month', description: '', active: true }

export function PaymentSettings({ state, api }) {
  const plans = state.settings.plans.items
  const currency = state.settings.payments.currency || 'USD'
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n) || 0)
  const [form, setForm] = useState(emptyPlan)
  const setPlans = (items, msg) => api.updateSettings('plans', { items }, msg)

  const addPlan = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const plan = { ...form, id: crypto.randomUUID(), price: Number(form.price) || 0 }
    setPlans([...plans, plan], `Added payment plan ${plan.name}`)
    setForm(emptyPlan)
  }
  const toggleActive = (id) =>
    setPlans(plans.map((p) => (p.id === id ? { ...p, active: !p.active } : p)))
  const removePlan = (id) => setPlans(plans.filter((p) => p.id !== id))

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={Wallet} title="Payment Settings" subtitle="Define the payment plans customers can subscribe to." />

      <Card>
        <CardHeader title="Payment plans" badge={`${plans.length}`} />
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <Th>Plan</Th><Th>Price</Th><Th>Billing</Th><Th>Status</Th><Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 && (
              <tr><Td className="text-mute" >No plans yet — add one below.</Td></tr>
            )}
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 align-top">
                <Td>
                  <p className="font-medium text-ink">{p.name}</p>
                  {p.description && <p className="text-xs text-mute">{p.description}</p>}
                </Td>
                <Td className="whitespace-nowrap font-medium text-ink">{fmt(p.price)}</Td>
                <Td className="whitespace-nowrap">{p.interval === 'one-time' ? 'One-time' : `per ${p.interval}`}</Td>
                <Td>
                  <button onClick={() => toggleActive(p.id)}>
                    <Badge tone={p.active ? 'good' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge>
                  </button>
                </Td>
                <Td className="text-right">
                  <Button variant="danger" onClick={() => removePlan(p.id)} aria-label={`Delete ${p.name}`}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Add a plan" />
        <form className="space-y-4 p-5" onSubmit={addPlan}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plan name">
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro" required />
            </Field>
            <Field label={`Price (${currency})`}>
              <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49" />
            </Field>
            <Field label="Billing interval">
              <select className={inputCls} value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}>
                {INTERVALS.map((i) => <option key={i} value={i}>{i === 'one-time' ? 'One-time' : `Per ${i}`}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.active ? 'Active' : 'Inactive'} onChange={(e) => setForm({ ...form, active: e.target.value === 'Active' })}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>
          </div>
          <Field label="Description">
            <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's included in this plan" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit"><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add plan</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ---------- Invoicing ----------
export function Invoicing({ state, api }) {
  const { draft, set, save, flash } = useSettingsForm(state, api, 'invoicing')
  const sample = 25000
  const tax = sample * (Number(draft.taxRate) || 0) / 100
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: draft.currency || 'USD' }).format(n)
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={FileText} title="Invoicing" subtitle="Configure how invoices are numbered, taxed, and branded." />
      <Card>
        <CardHeader title="Invoice settings" />
        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name">
              <input className={inputCls} value={draft.businessName} onChange={(e) => set({ businessName: e.target.value })} />
            </Field>
            <Field label="Billing email">
              <input className={inputCls} type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Tax / VAT ID">
              <input className={inputCls} value={draft.taxId} onChange={(e) => set({ taxId: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Tax rate (%)">
              <input className={inputCls} type="number" min="0" step="0.1" value={draft.taxRate} onChange={(e) => set({ taxRate: Number(e.target.value) })} />
            </Field>
            <Field label="Currency">
              <select className={inputCls} value={draft.currency} onChange={(e) => set({ currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Invoice prefix">
              <input className={inputCls} value={draft.prefix} onChange={(e) => set({ prefix: e.target.value })} />
            </Field>
            <Field label="Next invoice number">
              <input className={inputCls} type="number" min="1" value={draft.nextNumber} onChange={(e) => set({ nextNumber: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Footer note">
            <textarea className={`${inputCls} min-h-[64px] resize-y`} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <SaveButton flash={flash} onClick={() => save()} />
          </div>
        </div>
      </Card>
      <PreviewCard title="Sample invoice">
        <div className="rounded-lg border border-line bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">{draft.businessName || 'Your business'}</p>
            <p className="text-[13px] font-semibold text-ink">{draft.prefix}-{draft.nextNumber}</p>
          </div>
          <table className="mt-3 w-full text-[13px] text-ink-2">
            <tbody>
              <tr><td className="py-0.5">Subtotal</td><td className="py-0.5 text-right">{fmt(sample)}</td></tr>
              <tr><td className="py-0.5">Tax ({Number(draft.taxRate) || 0}%)</td><td className="py-0.5 text-right">{fmt(tax)}</td></tr>
              <tr className="font-semibold text-ink"><td className="py-1">Total</td><td className="py-1 text-right">{fmt(sample + tax)}</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-mute">{draft.notes}</p>
        </div>
      </PreviewCard>
    </div>
  )
}

// ---------- Booking calendar ----------
const SAMPLE_BOOKINGS = [
  { name: 'Mina Khan', service: 'Discovery call', when: 'Thu 10 Jul · 10:00am' },
  { name: 'Jonathan Brooks', service: 'Product demo', when: 'Fri 11 Jul · 2:30pm' },
  { name: 'Priya Nair', service: 'Onboarding session', when: 'Mon 14 Jul · 9:00am' },
]

export function Booking({ state, api }) {
  const { draft, set, save, flash } = useSettingsForm(state, api, 'booking')
  const toggle = () =>
    api.updateSettings('booking', { connected: !draft.connected }, draft.connected ? 'Disconnected booking calendar' : 'Connected booking calendar')
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={CalendarClock} title="Booking Calendar" subtitle="Let customers book appointments that sync to your calendar." />
      <Card>
        <CardHeader title="Scheduling" action={<StatusBadge connected={draft.connected} />} />
        <div className="space-y-4 p-5">
          <ConnectToggle connected={draft.connected} onToggle={toggle} label="Calendar" />
          <Field label="Booking link">
            <input className={inputCls} value={draft.bookingUrl} onChange={(e) => set({ bookingUrl: e.target.value })} placeholder="cal.com/thevinesolutions" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slot length (minutes)">
              <input className={inputCls} type="number" min="5" step="5" value={draft.slotLength} onChange={(e) => set({ slotLength: Number(e.target.value) })} />
            </Field>
            <Field label="Timezone">
              <input className={inputCls} value={draft.timezone} onChange={(e) => set({ timezone: e.target.value })} placeholder="UTC" />
            </Field>
          </div>
          <Field label="Availability">
            <input className={inputCls} value={draft.availability} onChange={(e) => set({ availability: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <SaveButton flash={flash} onClick={() => save()} />
          </div>
        </div>
      </Card>
      <PreviewCard title="Upcoming appointments">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <Th>Customer</Th><Th>Service</Th><Th>When</Th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_BOOKINGS.map((b) => (
              <tr key={b.name} className="border-b border-line last:border-0">
                <Td className="font-medium text-ink">{b.name}</Td>
                <Td>{b.service}</Td>
                <Td>{b.when}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </PreviewCard>
    </div>
  )
}

function PreviewCard({ title, children }) {
  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader title={title} />
      <div className="p-5">{children}</div>
    </Card>
  )
}
