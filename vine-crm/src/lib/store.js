import { useEffect, useState } from 'react'

const STORAGE_KEY = 'vine-crm-react-v1'
const AUTH_KEY = 'vine-crm-react-auth-v1'

export const DEAL_STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
export const CHANNELS = ['Direct', 'Online store', 'Marketplace', 'Retail', 'Wholesale']
export const PRODUCT_TYPES = ['Product', 'Service']
export const PRODUCT_STATUSES = ['Active', 'Draft', 'Archived']
export const SOCIAL_CHANNELS = ['Instagram', 'Facebook', 'X', 'LinkedIn', 'TikTok']
export const POST_STATUSES = ['Draft', 'Scheduled', 'Published']

const defaultState = {
  users: [
    { id: 'u1', name: 'Ava Chen', email: 'admin@vinecrm.com', role: 'Admin', status: 'Active' },
    { id: 'u2', name: 'Noah Patel', email: 'sales@vinecrm.com', role: 'Sales Rep', status: 'Active' },
    { id: 'u3', name: 'Lina Ortiz', email: 'service@vinecrm.com', role: 'Support Lead', status: 'Pending' },
  ],
  companies: [
    { id: 'co1', name: 'Northstar Labs', industry: 'SaaS', website: 'northstarlabs.com', owner: 'Mina', createdAt: '2026-05-02' },
    { id: 'co2', name: 'Atlas Commerce', industry: 'Retail', website: 'atlascommerce.com', owner: 'Ava', createdAt: '2026-05-18' },
    { id: 'co3', name: 'Harbor Health', industry: 'Healthcare', website: 'harborhealth.io', owner: 'Noah', createdAt: '2026-06-03' },
  ],
  contacts: [
    { id: 'ct1', firstName: 'Mina', lastName: 'Khan', title: 'Head of Growth', email: 'mina@northstarlabs.com', phone: '+1 555 990', companyId: 'co1', createdAt: '2026-06-10' },
    { id: 'ct2', firstName: 'Jonathan', lastName: 'Brooks', title: 'Operations Lead', email: 'jon@atlascommerce.com', phone: '+1 555 014', companyId: 'co2', createdAt: '2026-06-14' },
    { id: 'ct3', firstName: 'Priya', lastName: 'Nair', title: 'IT Director', email: 'priya@harborhealth.io', phone: '+1 555 221', companyId: 'co3', createdAt: '2026-06-20' },
  ],
  deals: [
    { id: 'd1', title: 'Expansion package', companyId: 'co1', contactId: 'ct1', stage: 'Proposal', value: 18000, closeDate: '2026-07-18', ownerId: 'u2', channel: 'Direct', productId: 'p1' },
    { id: 'd2', title: 'Renewal discussion', companyId: 'co2', contactId: 'ct2', stage: 'Qualified', value: 9500, closeDate: '2026-07-24', ownerId: 'u1', channel: 'Online store', productId: 'p4' },
    { id: 'd3', title: 'Patient portal rollout', companyId: 'co3', contactId: 'ct3', stage: 'Negotiation', value: 32000, closeDate: '2026-08-12', ownerId: 'u2', channel: 'Direct', productId: 'p2' },
    { id: 'd4', title: 'Support add-on', companyId: 'co1', contactId: 'ct1', stage: 'Won', value: 6200, closeDate: '2026-06-28', ownerId: 'u1', channel: 'Online store', productId: 'p3' },
    { id: 'd5', title: 'Analytics pilot', companyId: 'co2', contactId: 'ct2', stage: 'New', value: 12400, closeDate: '2026-09-02', ownerId: 'u3', channel: 'Marketplace', productId: 'p2' },
    { id: 'd6', title: 'Holiday bundle restock', companyId: 'co2', contactId: 'ct2', stage: 'Proposal', value: 21000, closeDate: '2026-08-30', ownerId: 'u2', channel: 'Wholesale', productId: 'p5' },
  ],
  products: [
    { id: 'p1', name: 'Growth Plan (Annual)', type: 'Service', sku: 'SVC-GROW-01', category: 'Subscription', price: 18000, cost: 6000, stock: null, image: '', status: 'Active', createdAt: '2026-05-01' },
    { id: 'p2', name: 'Analytics Suite', type: 'Service', sku: 'SVC-ANLYT-02', category: 'Subscription', price: 12400, cost: 3400, stock: null, image: '', status: 'Active', createdAt: '2026-05-04' },
    { id: 'p3', name: 'Priority Support Add-on', type: 'Service', sku: 'SVC-SUPP-03', category: 'Support', price: 6200, cost: 1200, stock: null, image: '', status: 'Active', createdAt: '2026-05-10' },
    { id: 'p4', name: 'Starter Hardware Kit', type: 'Product', sku: 'PRD-HW-04', category: 'Hardware', price: 950, cost: 620, stock: 42, image: '', status: 'Active', createdAt: '2026-05-15' },
    { id: 'p5', name: 'Holiday Gift Bundle', type: 'Product', sku: 'PRD-BND-05', category: 'Bundle', price: 210, cost: 150, stock: 8, image: '', status: 'Active', createdAt: '2026-06-01' },
    { id: 'p6', name: 'Legacy Onboarding Pack', type: 'Service', sku: 'SVC-ONB-06', category: 'Onboarding', price: 1500, cost: 500, stock: null, image: '', status: 'Archived', createdAt: '2026-04-02' },
  ],
  posts: [
    { id: 'ps1', content: 'New Analytics Suite is live — turn raw store data into decisions. Book a demo this week.', channels: ['LinkedIn', 'X'], scheduledFor: '2026-07-10', status: 'Scheduled', productId: 'p2', createdAt: '2026-07-05' },
    { id: 'ps2', content: 'Holiday Gift Bundles are back and selling fast — only a few left in stock! 🎁', channels: ['Instagram', 'Facebook', 'TikTok'], scheduledFor: '2026-07-06', status: 'Published', productId: 'p5', createdAt: '2026-07-01' },
    { id: 'ps3', content: 'Behind the scenes: how our team ships customer support that actually helps.', channels: ['LinkedIn'], scheduledFor: '', status: 'Draft', productId: 'p3', createdAt: '2026-07-04' },
  ],
  tasks: [
    { id: 't1', title: 'Send proposal follow-up', dueDate: '2026-07-06', priority: 'High', relatedTo: 'co1', status: 'Open' },
    { id: 't2', title: 'Confirm renewal meeting', dueDate: '2026-07-12', priority: 'Medium', relatedTo: 'co2', status: 'Open' },
    { id: 't3', title: 'Draft rollout timeline', dueDate: '2026-07-15', priority: 'High', relatedTo: 'co3', status: 'Open' },
    { id: 't4', title: 'Share pilot pricing', dueDate: '2026-07-03', priority: 'Low', relatedTo: 'co2', status: 'Done' },
  ],
  activities: [
    { id: 'a1', description: 'Added contact Priya Nair', createdAt: '2026-07-02' },
    { id: 'a2', description: 'Moved deal Patient portal rollout to Negotiation', createdAt: '2026-07-04' },
    { id: 'a3', description: 'Won deal Support add-on', createdAt: '2026-06-28' },
    { id: 'a4', description: 'Completed task Share pilot pricing', createdAt: '2026-07-05' },
  ],
}

export const todayStr = () => new Date().toISOString().slice(0, 10)
export const isOverdue = (task) => task.status === 'Open' && task.dueDate && task.dueDate < todayStr()
export const marginRate = (product) => {
  const price = Number(product?.price) || 0
  const cost = Number(product?.cost) || 0
  return price > 0 ? (price - cost) / price : 0
}

function normalize(parsed) {
  const base = structuredClone(defaultState)
  if (!parsed || typeof parsed !== 'object') return base
  const out = {}
  for (const key of Object.keys(base)) out[key] = Array.isArray(parsed[key]) ? parsed[key] : base[key]
  out.tasks = out.tasks.map((t) => ({ priority: 'Medium', status: 'Open', ...t }))
  out.deals = out.deals.map((d) => ({
    ...d,
    value: Number(d.value) || 0,
    stage: DEAL_STAGES.includes(d.stage) ? d.stage : 'New',
    channel: CHANNELS.includes(d.channel) ? d.channel : 'Direct',
  }))
  out.products = out.products.map((p) => ({
    ...p,
    price: Number(p.price) || 0,
    cost: Number(p.cost) || 0,
    image: typeof p.image === 'string' ? p.image : '',
    type: PRODUCT_TYPES.includes(p.type) ? p.type : 'Product',
    status: PRODUCT_STATUSES.includes(p.status) ? p.status : 'Active',
  }))
  out.posts = out.posts.map((p) => ({
    ...p,
    channels: Array.isArray(p.channels) ? p.channels.filter((c) => SOCIAL_CHANNELS.includes(c)) : [],
    status: POST_STATUSES.includes(p.status) ? p.status : 'Draft',
  }))
  return out
}

export function useCrmStore() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? normalize(JSON.parse(raw)) : structuredClone(defaultState)
    } catch {
      return structuredClone(defaultState)
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const logActivity = (description) => (prev) => ({
    ...prev,
    activities: [{ id: crypto.randomUUID(), description, createdAt: todayStr() }, ...prev.activities],
  })

  const api = {
    reset: () => setState(structuredClone(defaultState)),
    upsert: (collection, payload, activityMsg) =>
      setState((prev) => {
        const exists = prev[collection].some((item) => item.id === payload.id)
        const next = {
          ...prev,
          [collection]: exists
            ? prev[collection].map((item) => (item.id === payload.id ? { ...item, ...payload } : item))
            : [...prev[collection], payload],
        }
        return activityMsg && !exists ? logActivity(activityMsg)(next) : next
      }),
    remove: (collection, id) =>
      setState((prev) => ({ ...prev, [collection]: prev[collection].filter((item) => item.id !== id) })),
    setDealStage: (id, stage) =>
      setState((prev) => {
        const deal = prev.deals.find((d) => d.id === id)
        if (!deal || !DEAL_STAGES.includes(stage) || deal.stage === stage) return prev
        return logActivity(`Moved deal ${deal.title} to ${stage}`)({
          ...prev,
          deals: prev.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
        })
      }),
    moveDeal: (id, direction) =>
      setState((prev) => {
        const deal = prev.deals.find((d) => d.id === id)
        if (!deal) return prev
        const idx = DEAL_STAGES.indexOf(deal.stage) + direction
        if (idx < 0 || idx >= DEAL_STAGES.length) return prev
        const stage = DEAL_STAGES[idx]
        return logActivity(`Moved deal ${deal.title} to ${stage}`)({
          ...prev,
          deals: prev.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
        })
      }),
    toggleTask: (id) =>
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status: t.status === 'Open' ? 'Done' : 'Open' } : t)),
      })),
  }

  return [state, api]
}

export function useAuth(users) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const login = (email, password) => {
    const found = users.find((u) => u.email === email.trim())
    if (found && password === 'demo123') {
      setUser(found)
      localStorage.setItem(AUTH_KEY, JSON.stringify(found))
      return true
    }
    return false
  }
  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }
  return { user, login, logout }
}
