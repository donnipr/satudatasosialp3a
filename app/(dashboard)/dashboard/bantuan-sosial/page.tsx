import { createClient } from '@/lib/supabase/server'
import { HeartHandshake } from 'lucide-react'
import BantuanSosialClient from './_components/BantuanSosialClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Bantuan Sosial - Data Sosial',
  description: 'Manajemen Data Bantuan Sosial.',
}

export default async function BantuanSosialPage() {
  const supabase = await createClient()

  // Fetch current user role for RBAC
  const { data: { user } } = await supabase.auth.getUser()
  let role = 'user'
  if (user) {
    if (user.email === 'admin@dinsos.go.id') {
      role = 'IAM & ADMIN'
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role) role = profile.role
    }
  }

  // Fetch Master Data Reference
  const { data: masterData, error: masterError } = await supabase
    .from('master_referensi')
    .select('*')
    .order('kategori', { ascending: true })
    .order('nilai', { ascending: true })

  // Fetch Bantuan Sosial Data
  const { data: bansosData, error: bansosError } = await supabase
    .from('bantuan_sosial')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <HeartHandshake className="mr-3 text-red-600" size={32} />
            Bantuan Sosial
          </h1>
          <p className="text-gray-500 mt-2">
            Manajemen Data Bantuan Sosial dengan pendekatan Master Data.
          </p>
        </div>
      </div>

      {(masterError || bansosError) && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start shadow-sm">
          <p>
            <strong>Gagal memuat data.</strong> Pastikan tabel <code>bantuan_sosial</code> dan <code>master_referensi</code> sudah dibuat di Supabase. 
            ({masterError?.message || bansosError?.message})
          </p>
        </div>
      )}

      <BantuanSosialClient 
        role={role} 
        masterData={masterData || []} 
        initialData={bansosData || []} 
      />
    </div>
  )
}
