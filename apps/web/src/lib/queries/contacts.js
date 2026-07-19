import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../AuthContext'

export function useContacts() {
  const { org } = useAuth()
  return useQuery({
    queryKey: ['contacts', org.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts')
        .select('*, company:companies(id,name)')
        .eq('org_id', org.id).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function useContactMutation(fn) {
  const { org } = useAuth(); const qc = useQueryClient()
  return useMutation({ mutationFn: (v) => fn(v, org.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', org.id] }) })
}
export const useCreateContact = () => useContactMutation(async (values, org_id) => {
  const { error } = await supabase.from('contacts').insert({ ...values, org_id }); if (error) throw error })
export const useUpdateContact = () => useContactMutation(async ({ id, ...values }) => {
  const { error } = await supabase.from('contacts').update(values).eq('id', id); if (error) throw error })
export const useDeleteContact = () => useContactMutation(async ({ id }) => {
  const { error } = await supabase.from('contacts').delete().eq('id', id); if (error) throw error })
