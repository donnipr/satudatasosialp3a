'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function importCsvBantuanSosial(csvData: any[]) {
  const supabase = await createClient()

  // Ensure data doesn't exceed Supabase row limits (chunking if necessary)
  const chunkSize = 1000
  for (let i = 0; i < csvData.length; i += chunkSize) {
    const chunk = csvData.slice(i, i + chunkSize)
    const { error } = await supabase.from('bantuan_sosial').insert(chunk)
    
    if (error) {
      throw new Error(error.message)
    }
  }

  revalidatePath('/dashboard/bantuan-sosial')
}
