import { useEffect, useState } from 'react'
import { Mail, Check } from 'lucide-react'
import { Card, CardHeader, Button, Field, inputCls } from '../components/ui'

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export function Settings({ state, api }) {
  const saved = state.settings.email
  const [draft, setDraft] = useState(saved)
  const [flash, setFlash] = useState(false)
  useEffect(() => setDraft(saved), [saved])
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const save = () => {
    api.updateSettings('email', draft, 'Updated email settings')
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-slate-50 text-ink-2">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">Email Configuration</h1>
          <p className="text-[13px] text-mute">The main address this CRM sends from and how outgoing mail is delivered.</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Main address" />
        <div className="space-y-4 p-5">
          <Field label="Main CRM email">
            <input className={inputCls} type="email" value={draft.mainEmail} onChange={(e) => set({ mainEmail: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From name">
              <input className={inputCls} value={draft.fromName} onChange={(e) => set({ fromName: e.target.value })} />
            </Field>
            <Field label="From email">
              <input className={inputCls} type="email" value={draft.fromEmail} onChange={(e) => set({ fromEmail: e.target.value })} />
            </Field>
            <Field label="Reply-to">
              <input className={inputCls} type="email" value={draft.replyTo} onChange={(e) => set({ replyTo: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="SMTP delivery" badge="Optional" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="SMTP host" className="sm:col-span-2">
            <input className={inputCls} value={draft.smtpHost} onChange={(e) => set({ smtpHost: e.target.value })} placeholder="smtp.example.com" />
          </Field>
          <Field label="SMTP port">
            <input className={inputCls} type="number" value={draft.smtpPort} onChange={(e) => set({ smtpPort: Number(e.target.value) })} />
          </Field>
          <Field label="SMTP username">
            <input className={inputCls} value={draft.smtpUser} onChange={(e) => set({ smtpUser: e.target.value })} placeholder={draft.mainEmail} />
          </Field>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Notifications" />
        <div className="space-y-2.5 p-5">
          <Toggle label="Email me when a new lead is created" checked={draft.notifyNewLead} onChange={(v) => set({ notifyNewLead: v })} />
          <Toggle label="Email me when a task is due" checked={draft.notifyTaskDue} onChange={(v) => set({ notifyTaskDue: v })} />
          <Toggle label="Email me when an invoice is sent" checked={draft.notifyInvoiceSent} onChange={(v) => set({ notifyInvoiceSent: v })} />
        </div>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button onClick={save}>
          {flash ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {flash ? 'Saved' : 'Save settings'}
        </Button>
      </div>
    </div>
  )
}
