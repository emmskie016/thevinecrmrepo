import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const ACTIVE_ORG_KEY = 'vine-active-org'

const AuthContext = createContext(null)

function slugify(name) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'org'}-${suffix}`
}

async function fetchOrgs(userId) {
  const { data, error } = await supabase
    .from('org_members')
    .select('role, org_id, orgs(id, name, slug)')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map((row) => ({
    id: row.orgs?.id ?? row.org_id,
    name: row.orgs?.name,
    slug: row.orgs?.slug,
    role: row.role,
  }))
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [activeOrgId, setActiveOrgId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_ORG_KEY) || null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  const loadOrgsForUser = useCallback(async (userId) => {
    if (!userId) {
      setOrgs([])
      return
    }
    try {
      const nextOrgs = await fetchOrgs(userId)
      setOrgs(nextOrgs)
    } catch {
      setOrgs([])
    }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      if (data.session?.user) {
        await loadOrgsForUser(data.session.user.id)
      }
      if (mounted) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession ?? null)
      if (nextSession?.user) {
        await loadOrgsForUser(nextSession.user.id)
      } else {
        setOrgs([])
      }
    })

    return () => {
      mounted = false
      subscription?.subscription?.unsubscribe?.()
    }
  }, [loadOrgsForUser])

  const org = useMemo(() => {
    if (!orgs.length) return null
    return orgs.find((o) => o.id === activeOrgId) || orgs[0]
  }, [orgs, activeOrgId])

  const setActiveOrg = useCallback((id) => {
    setActiveOrgId(id)
    try {
      localStorage.setItem(ACTIVE_ORG_KEY, id)
    } catch {
      // ignore storage failures
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setSession(data.session ?? null)
    if (data.session?.user) {
      await loadOrgsForUser(data.session.user.id)
    }
    return data
  }, [loadOrgsForUser])

  const signUp = useCallback(async (email, password, fullName, orgName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error

    let activeSession = data.session ?? null
    if (!activeSession) {
      const signedIn = await supabase.auth.signInWithPassword({ email, password })
      if (signedIn.error) throw signedIn.error
      activeSession = signedIn.data.session ?? null
    }
    setSession(activeSession)

    try {
      const slug = slugify(orgName)
      const { data: newOrgId, error: rpcError } = await supabase.rpc('create_org_with_owner', {
        org_name: orgName,
        org_slug: slug,
      })
      if (rpcError) throw rpcError

      const userId = activeSession?.user?.id ?? data.user?.id
      if (userId) {
        await loadOrgsForUser(userId)
      }
      if (newOrgId) setActiveOrg(newOrgId)

      return { session: activeSession, orgId: newOrgId }
    } catch (rpcErr) {
      const err = new Error(
        `Account created, but organization setup failed — you can retry. (${rpcErr?.message || 'unknown error'})`,
      )
      err.cause = rpcErr
      throw err
    }
  }, [loadOrgsForUser, setActiveOrg])

  const createOrg = useCallback(async (orgName) => {
    const userId = session?.user?.id
    const slug = slugify(orgName)
    const { data: newOrgId, error: rpcError } = await supabase.rpc('create_org_with_owner', {
      org_name: orgName,
      org_slug: slug,
    })
    if (rpcError) throw rpcError

    if (userId) {
      await loadOrgsForUser(userId)
    }
    if (newOrgId) setActiveOrg(newOrgId)

    return { orgId: newOrgId }
  }, [session, loadOrgsForUser, setActiveOrg])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setOrgs([])
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      org,
      orgs,
      loading,
      signIn,
      signUp,
      signOut,
      setActiveOrg,
      createOrg,
    }),
    [session, org, orgs, loading, signIn, signUp, signOut, setActiveOrg, createOrg],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
