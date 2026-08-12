'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  if (user.email === 'admin@dinsos.go.id') return true
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role === 'IAM & ADMIN'
}

export async function createRekapDtsen(data: any) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) throw new Error('Unauthorized: Anda tidak memiliki izin untuk mengubah data DTSEN.')
  
  const supabase = await createClient()
  const { error } = await supabase.from('rekap_dtsen').insert(data)
  if (error) throw new Error(error.message)
    
  revalidatePath('/dashboard/dtsen')
}

export async function updateRekapDtsen(id: string, data: any) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) throw new Error('Unauthorized: Anda tidak memiliki izin untuk mengubah data DTSEN.')
  
  const supabase = await createClient()
  const { error } = await supabase.from('rekap_dtsen').update(data).eq('id', id)
  if (error) throw new Error(error.message)
    
  revalidatePath('/dashboard/dtsen')
}

export async function deleteRekapDtsen(id: string) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) throw new Error('Unauthorized: Anda tidak memiliki izin untuk mengubah data DTSEN.')
  
  const supabase = await createClient()
  const { error } = await supabase.from('rekap_dtsen').delete().eq('id', id)
  if (error) throw new Error(error.message)
    
  revalidatePath('/dashboard/dtsen')
}

export async function importCsvDtsen(csvData: any[]) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) throw new Error('Unauthorized: Anda tidak memiliki izin untuk mengubah data DTSEN.')
  
  const supabase = await createClient()
  const { error } = await supabase.from('rekap_dtsen').insert(csvData)
  if (error) throw new Error(error.message)
    
  revalidatePath('/dashboard/dtsen')
}
