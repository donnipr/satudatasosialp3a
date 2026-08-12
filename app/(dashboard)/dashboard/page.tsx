import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './_components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Find the latest year and period
  const { data: latest } = await supabase
    .from('rekap_dtsen')
    .select('tahun, periode')
    .order('tahun', { ascending: false })
    .order('periode', { ascending: false })
    .limit(1)
    .single()

  const currentTahun = latest ? latest.tahun : new Date().getFullYear()
  const currentPeriode = latest ? latest.periode : 'Triwulan 1'

  // Fetch all rows from rekap_dtsen for the latest period
  const { data: rekapData } = await supabase
    .from('rekap_dtsen')
    .select('*')
    .eq('tahun', currentTahun)
    .eq('periode', currentPeriode)

  const data = rekapData || []

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardClient data={data} currentTahun={currentTahun} currentPeriode={currentPeriode} />
    </div>
  )
}
