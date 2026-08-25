import UserManagementClient from './_components/UserManagementClient'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Manajemen Pengguna - Data Sosial',
  description: 'Kelola pengguna sistem dan hak akses.',
}

export default async function UsersPage() {
  const supabase = await createClient()
  
  // Fetch current user role for RBAC
  const { data: { user } } = await supabase.auth.getUser()
  let currentUserRole = 'user'
  if (user) {
    if (user.email === 'admin@dinsos.go.id') {
      currentUserRole = 'IAM & ADMIN'
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role) currentUserRole = profile.role
    }
  }

  if (currentUserRole !== 'IAM & ADMIN') {
    redirect('/dashboard')
  }

  // Fetch from public profiles table synced with Auth using Admin client to bypass RLS
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  console.log("FETCHED USERS:", profiles, error);

  const initialUsers = (profiles || []).map((p: any) => ({
    id: p.id,
    name: p.full_name || p.name || p.email?.split('@')[0] || 'Unknown',
    email: p.email || 'No email',
    role: p.role || 'Operator',
    status: p.status || 'Aktif',
    createdAt: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola daftar pengguna, peran, dan status akun sistem.</p>
        </div>
      </div>

      <UserManagementClient initialUsers={initialUsers} currentUserRole={currentUserRole} />
    </div>
  )
}
