export function Card({ children, className = '', ...props }) {
  return (
    <div className={`rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, badge, action }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
      <div className="flex items-center gap-2">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {badge != null && (
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{badge}</span>
        )}
      </div>
      {action}
    </div>
  )
}

const badgeTones = {
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-slate-100 text-ink-2',
}

export function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeTones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    outline: 'border border-line bg-card text-ink hover:bg-slate-50',
    ghost: 'text-ink-2 hover:bg-slate-100',
    danger: 'text-danger hover:bg-danger-soft',
  }
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 text-[13px] font-medium text-ink-2 ${className}`}>
      {label}
      {children}
    </label>
  )
}

export const inputCls =
  'rounded-md border border-line bg-card px-3 py-2 text-[13px] font-normal text-ink placeholder:text-mute focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-8 text-center text-[13px] text-mute">
        {children}
      </td>
    </tr>
  )
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-mute ${className}`}>
      {children}
    </th>
  )
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-3 text-[13px] text-ink-2 ${className}`}>{children}</td>
}

export function Avatar({ name }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-slate-50 text-[13px] font-semibold text-ink-2">
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  )
}
