import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, ShoppingCart, Send, Minus, ImageIcon } from 'lucide-react'
import { DndContext, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Card, CardHeader, Badge, Button, Field, inputCls, Th, Td, Avatar, EmptyRow } from '../components/ui'
import { DEAL_STAGES, CHANNELS, PRODUCT_TYPES, PRODUCT_STATUSES, SOCIAL_CHANNELS, POST_STATUSES, isOverdue } from '../lib/store'

const money = (n) => `$${Number(n || 0).toLocaleString()}`
const match = (q, ...fields) => !q || fields.some((f) => String(f ?? '').toLowerCase().includes(q.toLowerCase()))
const LOW_STOCK = 10

// Downscale an uploaded image to a small JPEG data URI so it fits in localStorage.
function readImageResized(file, maxDim = 480, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function FormPanel({ title, fields, initial, onSave, onClose }) {
  const [values, setValues] = useState(initial)
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  return (
    <Card className="mb-4 p-5">
      <h3 className="mb-3 text-[15px] font-semibold text-ink">{title}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave(values)
          onClose()
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} className={f.full ? 'sm:col-span-2' : ''}>
              {f.type === 'image' ? (
                <div className="flex items-center gap-3">
                  {values[f.key] ? (
                    <img src={values[f.key]} alt="Product preview" className="h-16 w-16 rounded-lg border border-line object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-line text-mute">
                      <ImageIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="cursor-pointer rounded-md border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-slate-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
                      {values[f.key] ? 'Replace' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const uri = await readImageResized(file)
                          setValues((v) => ({ ...v, [f.key]: uri }))
                        }}
                      />
                    </label>
                    {values[f.key] && (
                      <Button type="button" variant="ghost" onClick={() => setValues((v) => ({ ...v, [f.key]: '' }))}>Remove</Button>
                    )}
                  </div>
                </div>
              ) : f.type === 'textarea' ? (
                <textarea rows={3} className={`${inputCls} resize-y`} value={values[f.key] ?? ''} onChange={set(f.key)} required={f.required} />
              ) : f.type === 'multiselect' ? (
                <div className="flex flex-wrap gap-1.5">
                  {f.options.map((o) => {
                    const selected = (values[f.key] || []).includes(o.value)
                    return (
                      <button
                        type="button"
                        key={o.value}
                        aria-pressed={selected}
                        onClick={() =>
                          setValues((v) => {
                            const cur = v[f.key] || []
                            return { ...v, [f.key]: selected ? cur.filter((x) => x !== o.value) : [...cur, o.value] }
                          })
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
                          selected ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-card text-ink-2 hover:bg-slate-50'
                        }`}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              ) : f.options ? (
                <select className={inputCls} value={values[f.key] ?? ''} onChange={set(f.key)} required={f.required}>
                  <option value="" disabled>{f.placeholder || `Select ${f.label.toLowerCase()}`}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input className={inputCls} type={f.type || 'text'} value={values[f.key] ?? ''} onChange={set(f.key)} required={f.required} min={f.type === 'number' ? 0 : undefined} />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Card>
  )
}

function useCrud() {
  const [editing, setEditing] = useState(null) // null | 'new' | record
  return { editing, openNew: () => setEditing('new'), openEdit: setEditing, close: () => setEditing(null) }
}

function SectionHeader({ title, count, onAdd, addLabel }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{count}</span>
      </div>
      {onAdd && (
        <Button onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {addLabel}
        </Button>
      )}
    </div>
  )
}

export function Contacts({ state, api, search }) {
  const crud = useCrud()
  const companyName = (id) => state.companies.find((c) => c.id === id)?.name || 'Unassigned'
  const rows = state.contacts.filter((c) => match(search, c.firstName, c.lastName, c.title, c.email, c.phone, companyName(c.companyId)))
  const fields = [
    { key: 'firstName', label: 'First name', required: true },
    { key: 'lastName', label: 'Last name', required: true },
    { key: 'title', label: 'Title' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'companyId', label: 'Company', options: state.companies.map((c) => ({ value: c.id, label: c.name })) },
  ]
  return (
    <div>
      <SectionHeader title="Contacts" count={rows.length} onAdd={crud.openNew} addLabel="Add contact" />
      {crud.editing && (
        <FormPanel
          title={crud.editing === 'new' ? 'New contact' : 'Edit contact'}
          fields={fields}
          initial={crud.editing === 'new' ? {} : crud.editing}
          onClose={crud.close}
          onSave={(v) =>
            api.upsert('contacts', { createdAt: new Date().toISOString().slice(0, 10), ...v, id: crud.editing === 'new' ? crypto.randomUUID() : crud.editing.id }, `Added contact ${v.firstName} ${v.lastName}`)
          }
        />
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr><Th>Contact</Th><Th>Company</Th><Th>Email</Th><Th>Phone</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length ? rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.firstName} />
                      <div>
                        <div className="font-medium text-ink">{c.firstName} {c.lastName}</div>
                        <div className="text-xs text-mute">{c.title || 'Contact'}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{companyName(c.companyId)}</Td>
                  <Td>{c.email || '—'}</Td>
                  <Td>{c.phone || '—'}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" onClick={() => crud.openEdit(c)}>Edit</Button>
                    <Button variant="danger" aria-label={`Delete contact ${c.firstName} ${c.lastName}`} onClick={() => confirm(`Delete contact ${c.firstName} ${c.lastName}? This cannot be undone.`) && api.remove('contacts', c.id)}>Delete</Button>
                  </Td>
                </tr>
              )) : <EmptyRow colSpan={5}>{search ? 'No contacts match your search.' : 'No contacts yet.'}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function Companies({ state, api, search }) {
  const crud = useCrud()
  const rows = state.companies.filter((c) => match(search, c.name, c.industry, c.website, c.owner))
  const fields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'industry', label: 'Industry' },
    { key: 'website', label: 'Website' },
    { key: 'owner', label: 'Owner' },
  ]
  const linkedNote = (id) => {
    const contacts = state.contacts.filter((c) => c.companyId === id).length
    const deals = state.deals.filter((d) => d.companyId === id).length
    const tasks = state.tasks.filter((t) => t.relatedTo === id).length
    const total = contacts + deals + tasks
    return total ? ` It is linked to ${contacts} contact(s), ${deals} deal(s), and ${tasks} task(s); those links will show "Unassigned".` : ''
  }
  return (
    <div>
      <SectionHeader title="Companies" count={rows.length} onAdd={crud.openNew} addLabel="Add company" />
      {crud.editing && (
        <FormPanel
          title={crud.editing === 'new' ? 'New company' : 'Edit company'}
          fields={fields}
          initial={crud.editing === 'new' ? {} : crud.editing}
          onClose={crud.close}
          onSave={(v) => api.upsert('companies', { createdAt: new Date().toISOString().slice(0, 10), ...v, id: crud.editing === 'new' ? crypto.randomUUID() : crud.editing.id }, `Added company ${v.name}`)}
        />
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr><Th>Company</Th><Th>Industry</Th><Th>Website</Th><Th>Owner</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length ? rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <span className="font-medium text-ink">{c.name}</span>
                    </div>
                  </Td>
                  <Td>{c.industry || '—'}</Td>
                  <Td>{c.website || '—'}</Td>
                  <Td>{c.owner || '—'}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" onClick={() => crud.openEdit(c)}>Edit</Button>
                    <Button variant="danger" aria-label={`Delete company ${c.name}`} onClick={() => confirm(`Delete company ${c.name}?${linkedNote(c.id)} This cannot be undone.`) && api.remove('companies', c.id)}>Delete</Button>
                  </Td>
                </tr>
              )) : <EmptyRow colSpan={5}>{search ? 'No companies match your search.' : 'No companies yet.'}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function DealCard({ deal, stageIndex, crud, api, companyName, contactName, ownerName }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 20, position: 'relative' } : undefined}
      className={`cursor-grab touch-none rounded-lg border border-line bg-slate-50/50 p-3 active:cursor-grabbing ${isDragging ? 'opacity-70 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink">{deal.title}</span>
        {deal.channel && deal.channel !== 'Direct' && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warn-soft px-1.5 py-0.5 text-[10px] font-medium text-warn">
            <ShoppingCart className="h-2.5 w-2.5" aria-hidden="true" />
            {deal.channel}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-mute">{companyName(deal.companyId)} · {contactName(deal.contactId)}</div>
      <div className="text-xs text-mute">Owner: {ownerName(deal.ownerId)}</div>
      <div className="mt-1 text-[13px] font-medium text-ink">{money(deal.value)}</div>
      <div className="text-xs text-mute">Close {deal.closeDate || 'TBD'}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button variant="outline" className="!px-2 !py-1" disabled={stageIndex === 0} aria-label={`Move ${deal.title} to previous stage`} onPointerDown={(e) => e.stopPropagation()} onClick={() => api.moveDeal(deal.id, -1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" className="!px-2 !py-1" disabled={stageIndex === DEAL_STAGES.length - 1} aria-label={`Move ${deal.title} to next stage`} onPointerDown={(e) => e.stopPropagation()} onClick={() => api.moveDeal(deal.id, 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" className="!px-2 !py-1" onPointerDown={(e) => e.stopPropagation()} onClick={() => crud.openEdit(deal)}>Edit</Button>
        <Button variant="danger" className="!px-2 !py-1" aria-label={`Delete deal ${deal.title}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => confirm(`Delete deal ${deal.title}? This cannot be undone.`) && api.remove('deals', deal.id)}>Delete</Button>
      </div>
    </div>
  )
}

function StageColumn({ stage, children, count, total }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <Card ref={setNodeRef} className={`min-h-64 p-3 transition-colors ${isOver ? 'border-primary bg-primary-soft/40' : ''}`}>
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-ink">{stage}</h4>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-ink-2">{count}</span>
      </div>
      <div className="mb-3 text-xs text-mute">{money(total)}</div>
      <div className="space-y-2">{children}</div>
    </Card>
  )
}

export function Opportunities({ state, api, search }) {
  const crud = useCrud()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )
  const companyName = (id) => state.companies.find((c) => c.id === id)?.name || 'Unassigned'
  const contactName = (id) => {
    const c = state.contacts.find((x) => x.id === id)
    return c ? `${c.firstName} ${c.lastName}` : 'Unassigned'
  }
  const ownerName = (id) => state.users.find((u) => u.id === id)?.name || 'Unassigned'
  const visible = state.deals.filter((d) => match(search, d.title, companyName(d.companyId), contactName(d.contactId), ownerName(d.ownerId), d.channel))
  const fields = [
    { key: 'title', label: 'Title', required: true },
    { key: 'companyId', label: 'Company', options: state.companies.map((c) => ({ value: c.id, label: c.name })) },
    { key: 'contactId', label: 'Contact', options: state.contacts.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })) },
    { key: 'stage', label: 'Stage', options: DEAL_STAGES.map((s) => ({ value: s, label: s })), required: true },
    { key: 'channel', label: 'Sales channel', options: CHANNELS.map((c) => ({ value: c, label: c })), required: true },
    { key: 'ownerId', label: 'Owner', options: state.users.map((u) => ({ value: u.id, label: u.name })) },
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'closeDate', label: 'Close date', type: 'date' },
  ]
  return (
    <div>
      <SectionHeader title="Opportunities" count={visible.length} onAdd={crud.openNew} addLabel="Add opportunity" />
      {crud.editing && (
        <FormPanel
          title={crud.editing === 'new' ? 'New opportunity' : 'Edit opportunity'}
          fields={fields}
          initial={crud.editing === 'new' ? { stage: 'New', channel: 'Direct' } : crud.editing}
          onClose={crud.close}
          onSave={(v) => api.upsert('deals', { ...v, value: Number(v.value) || 0, id: crud.editing === 'new' ? crypto.randomUUID() : crud.editing.id }, `Added opportunity ${v.title}`)}
        />
      )}
      <DndContext
        sensors={sensors}
        onDragEnd={({ active, over }) => {
          if (active && over) api.setDealStage(active.id, over.id)
        }}
      >
        <div className="grid grid-cols-2 gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
          {DEAL_STAGES.map((stage, stageIndex) => {
            const stageDeals = visible.filter((d) => d.stage === stage)
            const total = stageDeals.reduce((s, d) => s + (Number(d.value) || 0), 0)
            return (
              <StageColumn key={stage} stage={stage} count={stageDeals.length} total={total}>
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    stageIndex={stageIndex}
                    crud={crud}
                    api={api}
                    companyName={companyName}
                    contactName={contactName}
                    ownerName={ownerName}
                  />
                ))}
              </StageColumn>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}

export function Tasks({ state, api, search }) {
  const crud = useCrud()
  const companyName = (id) => state.companies.find((c) => c.id === id)?.name || 'Unassigned'
  const rows = state.tasks.filter((t) => match(search, t.title, companyName(t.relatedTo), t.priority))
  const fields = [
    { key: 'title', label: 'Title', required: true },
    { key: 'dueDate', label: 'Due date', type: 'date' },
    { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'].map((p) => ({ value: p, label: p })), required: true },
    { key: 'relatedTo', label: 'Related company', options: state.companies.map((c) => ({ value: c.id, label: c.name })) },
  ]
  const tone = { High: 'danger', Medium: 'primary', Low: 'good' }
  return (
    <div>
      <SectionHeader title="Tasks" count={rows.length} onAdd={crud.openNew} addLabel="Add task" />
      {crud.editing && (
        <FormPanel
          title={crud.editing === 'new' ? 'New task' : 'Edit task'}
          fields={fields}
          initial={crud.editing === 'new' ? { priority: 'Medium' } : crud.editing}
          onClose={crud.close}
          onSave={(v) => api.upsert('tasks', { status: 'Open', ...(crud.editing === 'new' ? {} : crud.editing), ...v, id: crud.editing === 'new' ? crypto.randomUUID() : crud.editing.id }, `Added task ${v.title}`)}
        />
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr><Th>Task</Th><Th>Due</Th><Th>Related to</Th><Th>Priority</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length ? rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <Td><span className={`font-medium ${t.status === 'Done' ? 'text-mute line-through' : 'text-ink'}`}>{t.title}</span></Td>
                  <Td>
                    {t.dueDate || 'Soon'}
                    {isOverdue(t) && <span className="ml-2 text-xs font-semibold text-danger">Overdue</span>}
                  </Td>
                  <Td>{companyName(t.relatedTo)}</Td>
                  <Td><Badge tone={tone[t.priority] || 'neutral'}>{t.priority}</Badge></Td>
                  <Td><Badge tone={t.status === 'Done' ? 'good' : 'neutral'}>{t.status}</Badge></Td>
                  <Td className="text-right">
                    <Button variant="ghost" onClick={() => api.toggleTask(t.id)}>{t.status === 'Open' ? 'Mark done' : 'Reopen'}</Button>
                    <Button variant="ghost" onClick={() => crud.openEdit(t)}>Edit</Button>
                    <Button variant="danger" aria-label={`Delete task ${t.title}`} onClick={() => confirm(`Delete task ${t.title}? This cannot be undone.`) && api.remove('tasks', t.id)}>Delete</Button>
                  </Td>
                </tr>
              )) : <EmptyRow colSpan={6}>{search ? 'No tasks match your search.' : 'No tasks yet.'}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function UsersView({ state }) {
  return (
    <div>
      <SectionHeader title="Users" count={state.users.length} />
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-line">
            <tr><Th>User</Th><Th>Role</Th><Th>Status</Th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {state.users.map((u) => (
              <tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <div>
                      <div className="font-medium text-ink">{u.name}</div>
                      <div className="text-xs text-mute">{u.email}</div>
                    </div>
                  </div>
                </Td>
                <Td>{u.role}</Td>
                <Td><Badge tone={u.status === 'Active' ? 'good' : 'warn'}>{u.status}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

const productStatusTone = { Active: 'good', Draft: 'warn', Archived: 'neutral' }

export function Products({ state, api, search }) {
  const crud = useCrud()
  const rows = state.products.filter((p) => match(search, p.name, p.sku, p.category, p.type, p.status))
  const fields = [
    { key: 'image', label: 'Image', type: 'image', full: true },
    { key: 'name', label: 'Name', required: true, full: true },
    { key: 'type', label: 'Type', options: PRODUCT_TYPES.map((t) => ({ value: t, label: t })), required: true },
    { key: 'category', label: 'Category' },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'Price (sell)', type: 'number' },
    { key: 'cost', label: 'Cost', type: 'number' },
    { key: 'stock', label: 'Stock (products only)', type: 'number' },
    { key: 'status', label: 'Status', options: PRODUCT_STATUSES.map((s) => ({ value: s, label: s })), required: true },
  ]
  return (
    <div>
      <SectionHeader title="Products & Services" count={rows.length} onAdd={crud.openNew} addLabel="Add item" />
      {crud.editing && (
        <FormPanel
          title={crud.editing === 'new' ? 'New product or service' : 'Edit item'}
          fields={fields}
          initial={crud.editing === 'new' ? { type: 'Product', status: 'Active' } : crud.editing}
          onClose={crud.close}
          onSave={(v) =>
            api.upsert(
              'products',
              {
                createdAt: new Date().toISOString().slice(0, 10),
                ...v,
                price: Number(v.price) || 0,
                cost: Number(v.cost) || 0,
                image: v.image || '',
                stock: v.type === 'Service' || v.stock === '' || v.stock == null ? null : Number(v.stock),
                id: crud.editing === 'new' ? crypto.randomUUID() : crud.editing.id,
              },
              `Added ${v.type?.toLowerCase() || 'item'} ${v.name}`,
            )
          }
        />
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr><Th>Item</Th><Th>Type</Th><Th className="text-right">Price</Th><Th className="text-right">Margin</Th><Th className="text-center">Stock</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length ? rows.map((p) => {
                const margin = p.price > 0 ? Math.round(((p.price - (p.cost || 0)) / p.price) * 100) : 0
                const low = p.type !== 'Service' && (p.stock ?? 0) <= LOW_STOCK
                const setStock = (next) => api.upsert('products', { ...p, stock: Math.max(0, next) }, null)
                return (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-9 w-9 shrink-0 rounded-lg border border-line object-cover" />
                      ) : (
                        <Avatar name={p.name} />
                      )}
                      <div>
                        <div className="font-medium text-ink">{p.name}</div>
                        <div className="text-xs text-mute">{p.sku || '—'} · {p.category || 'Uncategorized'}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge tone={p.type === 'Service' ? 'primary' : 'neutral'}>{p.type}</Badge></Td>
                  <Td className="text-right font-medium text-ink">{money(p.price)}</Td>
                  <Td className="text-right"><span className={margin >= 50 ? 'text-good' : margin >= 25 ? 'text-ink-2' : 'text-warn'}>{margin}%</span></Td>
                  <Td className="text-center">
                    {p.type === 'Service' ? (
                      <span className="text-mute">—</span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <button aria-label={`Decrease stock of ${p.name}`} onClick={() => setStock((p.stock ?? 0) - 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-ink-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"><Minus className="h-3 w-3" /></button>
                        <span className={`w-8 text-center text-[13px] font-medium ${low ? 'text-warn' : 'text-ink'}`}>{p.stock ?? 0}</span>
                        <button aria-label={`Increase stock of ${p.name}`} onClick={() => setStock((p.stock ?? 0) + 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-ink-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"><Plus className="h-3 w-3" /></button>
                      </div>
                    )}
                  </Td>
                  <Td><Badge tone={productStatusTone[p.status] || 'neutral'}>{p.status}</Badge></Td>
                  <Td className="text-right">
                    <Button variant="ghost" onClick={() => crud.openEdit(p)}>Edit</Button>
                    <Button variant="danger" aria-label={`Delete ${p.name}`} onClick={() => confirm(`Delete ${p.name}? This cannot be undone.`) && api.remove('products', p.id)}>Delete</Button>
                  </Td>
                </tr>
                )
              }) : <EmptyRow colSpan={7}>{search ? 'No items match your search.' : 'No products or services yet.'}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const postStatusTone = { Draft: 'neutral', Scheduled: 'warn', Published: 'good' }

export function Marketing({ state, api, search }) {
  const crud = useCrud()
  const productName = (id) => state.products.find((p) => p.id === id)?.name
  const rows = state.posts.filter((p) => match(search, p.content, p.status, (p.channels || []).join(' '), productName(p.productId)))
  const fields = [
    { key: 'content', label: 'Post content', type: 'textarea', required: true, full: true },
    { key: 'channels', label: 'Channels', type: 'multiselect', options: SOCIAL_CHANNELS.map((c) => ({ value: c, label: c })), full: true },
    { key: 'productId', label: 'Promotes (optional)', options: state.products.map((p) => ({ value: p.id, label: p.name })) },
    { key: 'scheduledFor', label: 'Scheduled for', type: 'date' },
    { key: 'status', label: 'Status', options: POST_STATUSES.map((s) => ({ value: s, label: s })), required: true },
  ]
  const setStatus = (post, status) => api.upsert('posts', { ...post, status }, null)
  return (
    <div>
      <SectionHeader title="Social posts" count={rows.length} onAdd={crud.openNew} addLabel="Compose post" />
      {crud.editing && (
        <FormPanel
          title={crud.editing === 'new' ? 'Compose post' : 'Edit post'}
          fields={fields}
          initial={crud.editing === 'new' ? { channels: [], status: 'Draft' } : crud.editing}
          onClose={crud.close}
          onSave={(v) =>
            api.upsert(
              'posts',
              { createdAt: new Date().toISOString().slice(0, 10), ...v, channels: v.channels || [], id: crud.editing === 'new' ? crypto.randomUUID() : crud.editing.id },
              'Scheduled a social post',
            )
          }
        />
      )}
      {rows.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((post) => (
            <Card key={post.id} className="flex flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <Badge tone={postStatusTone[post.status]}>{post.status}</Badge>
                <span className="text-xs text-mute">{post.scheduledFor || 'No date'}</span>
              </div>
              <p className="flex-1 text-[13px] text-ink">{post.content}</p>
              {post.productId && productName(post.productId) && (
                <p className="mt-2 text-xs text-mute">Promotes: {productName(post.productId)}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {(post.channels || []).length ? post.channels.map((c) => (
                  <span key={c} className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">{c}</span>
                )) : <span className="text-xs text-mute">No channels</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-3">
                {post.status !== 'Published' ? (
                  <Button variant="outline" className="!px-2 !py-1" onClick={() => setStatus(post, 'Published')}><Send className="h-3.5 w-3.5" /> Publish</Button>
                ) : (
                  <Button variant="ghost" className="!px-2 !py-1" onClick={() => setStatus(post, 'Draft')}>Unpublish</Button>
                )}
                <Button variant="ghost" className="!px-2 !py-1" onClick={() => crud.openEdit(post)}>Edit</Button>
                <Button variant="danger" className="!px-2 !py-1" aria-label="Delete post" onClick={() => confirm('Delete this post? This cannot be undone.') && api.remove('posts', post.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-[13px] text-mute">{search ? 'No posts match your search.' : 'No posts yet. Compose your first one.'}</Card>
      )}
    </div>
  )
}
