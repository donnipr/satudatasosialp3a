import { createClient } from '@/lib/supabase/server'
import { FileSpreadsheet } from 'lucide-react'
import { DtsenToolbar } from './_components/DtsenToolbar'
import { DtsenTable } from './_components/DtsenTable'
import { DtsenFilter } from './_components/DtsenFilter'
import { DtsenSummary } from './_components/DtsenSummary'
import { DtsenTabsLayout } from './_components/DtsenTabsLayout'

export const dynamic = 'force-dynamic'

export default async function DtsenPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string; periode?: string }>
}) {
  const supabase = await createClient()

  // Determine filtering values, defaulting to latest if missing
  const resolvedSearchParams = await searchParams
  let selectedTahun = resolvedSearchParams?.tahun
  let selectedPeriode = resolvedSearchParams?.periode

  if (!selectedTahun || !selectedPeriode) {
    const { data: latest } = await supabase
      .from('rekap_dtsen')
      .select('tahun, periode')
      .order('tahun', { ascending: false })
      .order('periode', { ascending: false })
      .limit(1)
      .single()
      
    if (latest) {
      if (!selectedTahun) selectedTahun = latest.tahun.toString()
      if (!selectedPeriode) selectedPeriode = latest.periode
    } else {
      selectedTahun = new Date().getFullYear().toString()
      selectedPeriode = 'Triwulan 1'
    }
  }

  // Fetch the filtered data
  const { data: rawData, error } = await supabase
    .from('rekap_dtsen')
    .select('*')
    .eq('tahun', parseInt(selectedTahun || '2024'))
    .eq('periode', selectedPeriode || 'Triwulan 1')
    .order('kecamatan', { ascending: true })
    .order('kelurahan', { ascending: true })

  const data = rawData || []

  // Trend Calculation Logic
  let prevTahun = parseInt(selectedTahun || '2024');
  let prevPeriode = selectedPeriode || 'Triwulan 1';
  const periodeNumber = parseInt(prevPeriode.replace(/[^0-9]/g, '')) || 1;
  
  if (periodeNumber > 1) {
    prevPeriode = `Triwulan ${periodeNumber - 1}`;
  } else {
    prevPeriode = 'Triwulan 4';
    prevTahun -= 1;
  }

  const { data: prevRawData } = await supabase
    .from('rekap_dtsen')
    .select('*')
    .eq('tahun', prevTahun)
    .eq('periode', prevPeriode)

  const prevData = prevRawData || []

  // Fetch user role with fallback
  const { data: { user } } = await supabase.auth.getUser()
  let role = 'user'
  if (user) {
    if (user.email === 'admin@dinsos.go.id') {
      role = 'IAM & ADMIN'
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role) role = profile.role
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileSpreadsheet className="mr-3 text-red-600" size={32} />
            Rekap Data Terpadu (DTSEN)
          </h1>
          <p className="text-gray-500 mt-2">
            Statistik agregat berdasarkan desil dan peringkat kesejahteraan per kalurahan.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-end gap-3">
          <DtsenFilter 
            currentTahun={selectedTahun || new Date().getFullYear().toString()} 
            currentPeriode={selectedPeriode || 'Triwulan 1'} 
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 flex items-start shadow-sm">
          <p>
            <strong>Gagal memuat data.</strong> Pastikan tabel <code>rekap_dtsen</code> sudah dibuat di Supabase. 
            ({error.message})
          </p>
        </div>
      )}

      {/* Main Tabs Layout */}
      <DtsenTabsLayout 
        toolbar={<DtsenToolbar role={role} data={data} />}
        table={<DtsenTable data={data} role={role} />}
        summary={<DtsenSummary data={data} prevData={prevData} />}
      />
    </div>
  )
}
