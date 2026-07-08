import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Briefcase, Users, AlarmClock, CircleDollarSign } from 'lucide-react'
import { Card, CardHeader, Badge, Th, Td, Avatar } from '../components/ui'
import { DEAL_STAGES, CHANNELS, isOverdue } from '../lib/store'

const INDIGO = '#3b4fd8'
const PRIORITY_COLORS = { High: '#3b4fd8', Medium: '#0d9488', Low: '#d97706' }
const money = (n) => `$${Number(n || 0).toLocaleString()}`

function StatCard({ label, value, sub, icon: Icon, subTone = 'text-good' }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">{label}</span>
        <Icon className="h-4 w-4 text-mute" aria-hidden="true" />
      </div>
      <div className="mt-2 text-[28px] font-bold leading-none text-ink">{value}</div>
      {sub && <div className={`mt-2 text-xs font-medium ${subTone}`}>{sub}</div>}
    </Card>
  )
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-card px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-ink">{label ?? payload[0].name}</div>
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="mt-0.5 text-ink-2">
          {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ state }) {
  const openDeals = state.deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
  const pipelineValue = openDeals.reduce((s, d) => s + (Number(d.value) || 0), 0)
  const overdue = state.tasks.filter(isOverdue)

  const byStage = DEAL_STAGES.map((stage) => ({
    stage,
    value: state.deals.filter((d) => d.stage === stage).reduce((s, d) => s + (Number(d.value) || 0), 0),
    count: state.deals.filter((d) => d.stage === stage).length,
  }))

  const byMonth = Object.entries(
    state.deals.reduce((acc, d) => {
      const month = (d.closeDate || '').slice(0, 7)
      if (!month) return acc
      acc[month] = (acc[month] || 0) + (Number(d.value) || 0)
      return acc
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }))

  const byChannel = CHANNELS.map((channel) => ({
    channel,
    value: openDeals.filter((d) => (d.channel || 'Direct') === channel).reduce((s, d) => s + (Number(d.value) || 0), 0),
  })).filter((c) => c.value > 0)

  const openTasks = state.tasks.filter((t) => t.status === 'Open')
  const byPriority = ['High', 'Medium', 'Low']
    .map((priority) => ({ name: priority, value: openTasks.filter((t) => t.priority === priority).length }))
    .filter((d) => d.value > 0)

  const recentDeals = [...state.deals].sort((a, b) => (b.closeDate || '').localeCompare(a.closeDate || '')).slice(0, 5)
  const companyName = (id) => state.companies.find((c) => c.id === id)?.name || 'Unassigned'
  const ownerName = (id) => state.users.find((u) => u.id === id)?.name || 'Unassigned'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pipeline value" value={money(pipelineValue)} sub={`${openDeals.length} open deals`} icon={CircleDollarSign} subTone="text-mute" />
        <StatCard label="Open opportunities" value={openDeals.length} sub={`${state.deals.filter((d) => d.stage === 'Won').length} won to date`} icon={Briefcase} />
        <StatCard label="Overdue tasks" value={overdue.length} sub={overdue.length ? 'Needs attention' : 'All on track'} icon={AlarmClock} subTone={overdue.length ? 'text-danger' : 'text-good'} />
        <StatCard label="Contacts" value={state.contacts.length} sub={`${state.companies.length} companies`} icon={Users} subTone="text-mute" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Pipeline by stage" />
          <div className="h-64 px-4 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStage} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef1f6" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip cursor={{ fill: 'rgba(59,79,216,0.06)' }} content={<ChartTooltip formatter={money} />} />
                <Bar dataKey="value" fill={INDIGO} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Expected close value by month" />
          <div className="h-64 px-4 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byMonth} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="fillIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INDIGO} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={INDIGO} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef1f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<ChartTooltip formatter={money} />} />
                <Area type="monotone" dataKey="value" stroke={INDIGO} strokeWidth={2} fill="url(#fillIndigo)" dot={{ r: 3, fill: INDIGO }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Open pipeline by sales channel" />
        <div className="px-5 pb-5 pt-2">
          {byChannel.length ? (
            <ul className="space-y-3">
              {byChannel.map((c) => {
                const max = Math.max(...byChannel.map((x) => x.value))
                return (
                  <li key={c.channel} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[13px] text-ink-2">{c.channel}</span>
                    <span className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, (c.value / max) * 100 * 0.7)}%` }} aria-hidden="true" />
                    <span className="text-[13px] font-medium text-ink">{money(c.value)}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-4 text-center text-[13px] text-mute">No open deals.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader title="Recent deals" badge={state.deals.length} />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr>
                  <Th>Deal</Th>
                  <Th>Company</Th>
                  <Th>Channel</Th>
                  <Th>Owner</Th>
                  <Th className="text-right">Value</Th>
                  <Th>Stage</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={deal.title} />
                        <div>
                          <div className="font-medium text-ink">{deal.title}</div>
                          <div className="text-xs text-mute">Close {deal.closeDate || 'TBD'}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{companyName(deal.companyId)}</Td>
                    <Td>{deal.channel || 'Direct'}</Td>
                    <Td>{ownerName(deal.ownerId)}</Td>
                    <Td className="text-right font-medium text-ink">{money(deal.value)}</Td>
                    <Td>
                      <Badge tone={deal.stage === 'Won' ? 'good' : deal.stage === 'Lost' ? 'danger' : 'primary'}>{deal.stage}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Open tasks by priority" badge={openTasks.length} />
          {byPriority.length ? (
            <div className="h-56 px-4 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byPriority} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="#ffffff" strokeWidth={2}>
                    {byPriority.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v} task${v === 1 ? '' : 's'}`} />} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-ink-2">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-[13px] text-mute">No open tasks.</p>
          )}
          <div className="border-t border-line px-5 py-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">Recent activity</h4>
            <ul className="mt-2 space-y-2">
              {state.activities.slice(0, 3).map((a) => (
                <li key={a.id} className="text-[13px] text-ink-2">
                  {a.description}
                  <span className="ml-1.5 text-xs text-mute">{a.createdAt}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
