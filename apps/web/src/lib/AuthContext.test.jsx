import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const authState = {
  getSessionResult: { data: { session: null }, error: null },
  onAuthStateChangeCb: null,
}

vi.mock('./supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(() => Promise.resolve(authState.getSessionResult)),
        onAuthStateChange: vi.fn((cb) => {
          authState.onAuthStateChangeCb = cb
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        }),
        signUp: vi.fn(() =>
          Promise.resolve({
            data: {
              session: { access_token: 'tok', user: { id: 'user-1', email: 'a@b.com' } },
              user: { id: 'user-1', email: 'a@b.com' },
            },
            error: null,
          }),
        ),
        signInWithPassword: vi.fn(() =>
          Promise.resolve({
            data: { session: { access_token: 'tok', user: { id: 'user-1', email: 'a@b.com' } } },
            error: null,
          }),
        ),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
      },
      rpc: vi.fn(() => Promise.resolve({ data: 'org-uuid-1', error: null })),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  role: 'owner',
                  org_id: 'org-uuid-1',
                  orgs: { id: 'org-uuid-1', name: 'Acme', slug: 'acme-abcd' },
                },
              ],
              error: null,
            }),
          ),
        })),
      })),
    },
  }
})

import { supabase } from './supabase'
import { AuthProvider, useAuth } from './AuthContext'

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="session">{auth.session ? 'yes' : 'no'}</div>
      <div data-testid="org">{auth.org ? auth.org.name : 'none'}</div>
      <button
        onClick={() => auth.signUp('a@b.com', 'password123', 'Jane Doe', 'Acme')}
      >
        signup
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.getSessionResult = { data: { session: null }, error: null }
    try {
      window.localStorage.clear()
    } catch {
      // jsdom localStorage may be unavailable in some environments
    }
  })

  it('exposes null session and loading=false initially once resolved', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('session').textContent).toBe('no')
    expect(screen.getByTestId('org').textContent).toBe('none')
  })

  it('signUp calls supabase.auth.signUp then create_org_with_owner rpc', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await act(async () => {
      await user.click(screen.getByText('signup'))
    })

    expect(supabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'a@b.com',
        password: 'password123',
        options: expect.objectContaining({ data: expect.objectContaining({ full_name: 'Jane Doe' }) }),
      }),
    )
    expect(supabase.rpc).toHaveBeenCalledWith(
      'create_org_with_owner',
      expect.objectContaining({ org_name: 'Acme' }),
    )
    await waitFor(() => expect(screen.getByTestId('org').textContent).toBe('Acme'))
  })
})
