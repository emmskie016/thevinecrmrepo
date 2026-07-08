import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area, PieChart, Pie, Legend,
} from 'recharts'
import { TrendingUp, Percent, Receipt, Package } from 'lucide-react'
import { Card, CardHeader } from '../components/ui'
import { CHANNELS, POST_STATUSES } from '../lib/store'

const INDIGO = '#3b4fd8'
const money = (n) => `$${Number(n || 0).toLocaleString()}`
// Semantic status colors (reserved, not reused as categorical series)
const OUTCOME = { Won: '#16a34a', Open: '#3b4fd8', Lost: '#dc2626' }
const POST_COLOR = { Draft: '#64748b', Scheduled: '#d97706', Published: '#16a34a' }

function StatCard({ label, value, sub, icon: Icon, subTone = 'text-mute' }) {
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
        <div key={p.dataKey ?? p.name} className="mt-0.5 text-ink-2">{formatter ? formatter(p.value) : p.value}</div>
      ))}
    </div>
  )
}

export default function Reports({ state }) {
  const won = state.deals.filter((d) => d.stage === 'Won')
  const lost = state.deals.filter((d) => d.stage === 'Lost')
  const open = state.deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
  const wonRevenue = won.reduce((s, d) => s + (Number(d.value) || 0), 0)
  const closed = won.length + lost.length
  const winRate = closed ? Math.round((won.length / closed) * 100) : 0
  const avgDeal = won.length ? Math.round(wonRevenue / won.length) : 0
  const activeProducts = state.products.filter((p) => p.status === 'Active').length

  const wonByMonth = Object.entries(
    won.reduce((acc, d) => {
      const m = (d.closeDate || '').slice(0, 7)
      if (m) acc[m] = (acc[m] || 0) + (Number(d.value) || 0)
      return acc
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }))

  const outcomes = [
    { name: 'Won', value: won.length },
    { name: 'Open', value: open.length },
    { name: 'Lost', value: lost.length },
  ].filter((o) => o.value > 0)

  const revenueByChannel = CHANNELS.map((channel) => ({
    channel,
    value: won.filter((d) => (d.channel || 'Direct') === channel).reduce((s, d) => s + (Number(d.value) || 0), 0),
  })).filter((c) => c.value > 0)

  const productName = (id) => state.products.find((p) => p.id === id)?.name || 'Unassigned'
  const topProducts = Object.entries(
    state.deals.reduce((acc, d) => {
      const name = productName(d.productId)
      acc[name] = (acc[name] || 0) + (Number(d.value) || 0)
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const postsByStatus = POST_STATUSES.map((status) => ({
    name: status,
    value: state.posts.filter((p) => p.status === status).length,
  })).filter((p) => p.value > 0)

  const axisTick = { fontSize: 12, fill: '#64748b' }
  const kFormat = (v) => `$${v / 1000}k`

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Reports</h1>
        <p className="text-[13px] text-mute">Sales, product, and marketing performance across your pipeline.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Won revenue" value={money(wonRevenue)} sub={`${won.length} deals won`} icon={TrendingUp} subTone="text-good" />
        <StatCard label="Win rate" value={`${winRate}%`} sub={`${won.length} won / ${lost.length} lost`} icon={Percent} />
        <StatCard label="Avg deal size" value={money(avgDeal)} sub="won deals" icon={Receipt} />
        <StatCard label="Active catalog" value={activeProducts} sub={`${state.products.length} total items`} icon={Package} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Won revenue by month" />
          <div className="h-64 px-4 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wonByMonth} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INDIGO} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={INDIGO} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef1f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} />
                <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} tickFormatter={kFormat} />
                <Tooltip content={<ChartTooltip formatter={money} />} />
                <Area type="monotone" dataKey="value" stroke={INDIGO} strokeWidth={2} fill="url(#repFill)" dot={{ r: 3, fill: INDIGO }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Deal outcomes" />
          <div className="h-64 px-4 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomes} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef1f6" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
                <YAxis tickLine={false} axisLine={false} width={32} tick={axisTick} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(59,79,216,0.06)' }} content={<ChartTooltip formatter={(v) => `${v} deal${v === 1 ? '' : 's'}`} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {outcomes.map((o) => (
                    <Cell key={o.name} fill={OUTCOME[o.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Top products by pipeline value" />
          <div className="h-64 px-4 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                <CartesianGrid horizontal={false} stroke="#eef1f6" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={kFormat} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip cursor={{ fill: 'rgba(59,79,216,0.06)' }} content={<ChartTooltip formatter={money} />} />
                <Bar dataKey="value" fill={INDIGO} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Won revenue by sales channel" />
          <div className="h-64 px-4 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByChannel} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef1f6" />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} tick={{ ...axisTick, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} tickFormatter={kFormat} />
                <Tooltip cursor={{ fill: 'rgba(59,79,216,0.06)' }} content={<ChartTooltip formatter={money} />} />
                <Bar dataKey="value" fill={INDIGO} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Social posts by status" badge={state.posts.length} />
        {postsByStatus.length ? (
          <div className="h-56 px-4 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={postsByStatus} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="#ffffff" strokeWidth={2}>
                  {postsByStatus.map((p) => (
                    <Cell key={p.name} fill={POST_COLOR[p.name]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} post${v === 1 ? '' : 's'}`} />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-ink-2">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-[13px] text-mute">No posts yet.</p>
        )}
      </Card>
    </div>
  )
}
