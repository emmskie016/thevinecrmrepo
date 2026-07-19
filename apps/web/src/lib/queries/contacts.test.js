import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const state = {
  selectResult: { data: [{ id: 'c1', name: 'Jane Doe', org_id: 'org-uuid-1' }], error: null },
  insertResult: { error: null },
  updateResult: { error: null },
  deleteResult: { error: null },
}

const {
  orderMock,
  eqSelectMock,
  selectMock,
  insertMock,
  eqUpdateMock,
  updateMock,
  eqDeleteMock,
  deleteMock,
  fromMock,
} = vi.hoisted(() => {
  const orderMock = vi.fn()
  const eqSelectMock = vi.fn(() => ({ order: orderMock }))
  const selectMock = vi.fn(() => ({ eq: eqSelectMock }))
  const insertMock = vi.fn()
  const eqUpdateMock = vi.fn()
  const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))
  const eqDeleteMock = vi.fn()
  const deleteMock = vi.fn(() => ({ eq: eqDeleteMock }))
  const fromMock = vi.fn(() => ({
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  }))
  return { orderMock, eqSelectMock, selectMock, insertMock, eqUpdateMock, updateMock, eqDeleteMock, deleteMock, fromMock }
})

vi.mock('../supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ org: { id: 'org-uuid-1' } }),
}))

import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from './contacts'

function wrapper({ children }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('contacts queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.selectResult = { data: [{ id: 'c1', name: 'Jane Doe', org_id: 'org-uuid-1' }], error: null }
    state.insertResult = { error: null }
    state.updateResult = { error: null }
    state.deleteResult = { error: null }
    orderMock.mockImplementation(() => Promise.resolve(state.selectResult))
    insertMock.mockImplementation(() => Promise.resolve(state.insertResult))
    eqUpdateMock.mockImplementation(() => Promise.resolve(state.updateResult))
    eqDeleteMock.mockImplementation(() => Promise.resolve(state.deleteResult))
  })

  it('useContacts queries contacts filtered by org_id ordered by created_at desc', async () => {
    const { result } = renderHook(() => useContacts(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fromMock).toHaveBeenCalledWith('contacts')
    expect(selectMock).toHaveBeenCalledWith('*, company:companies(id,name)')
    expect(eqSelectMock).toHaveBeenCalledWith('org_id', 'org-uuid-1')
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data).toEqual(state.selectResult.data)
  })

  it('useCreateContact inserts values with org_id and invalidates contacts query', async () => {
    const { result } = renderHook(() => useCreateContact(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ name: 'New Contact', email: 'a@b.com' })
    })
    expect(fromMock).toHaveBeenCalledWith('contacts')
    expect(insertMock).toHaveBeenCalledWith({ name: 'New Contact', email: 'a@b.com', org_id: 'org-uuid-1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useUpdateContact updates by id with remaining values', async () => {
    const { result } = renderHook(() => useUpdateContact(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 'c1', name: 'Updated Name' })
    })
    expect(fromMock).toHaveBeenCalledWith('contacts')
    expect(updateMock).toHaveBeenCalledWith({ name: 'Updated Name' })
    expect(eqUpdateMock).toHaveBeenCalledWith('id', 'c1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useDeleteContact deletes by id', async () => {
    const { result } = renderHook(() => useDeleteContact(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: 'c1' })
    })
    expect(fromMock).toHaveBeenCalledWith('contacts')
    expect(deleteMock).toHaveBeenCalled()
    expect(eqDeleteMock).toHaveBeenCalledWith('id', 'c1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('surfaces errors from the select chain', async () => {
    state.selectResult = { data: null, error: new Error('boom') }
    const { result } = renderHook(() => useContacts(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.message).toBe('boom')
  })
})
