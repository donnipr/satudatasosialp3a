import { createClient } from '@/lib/supabase/server'
import GisMapClient from './_components/GisMapClient'

export const dynamicConfig = 'force-dynamic'

export default async function GisMapPage() {
  const supabase = await createClient()

  // Fetch all rows from rekap_dtsen for all periods
  const { data: rekapData } = await supabase
    .from('rekap_dtsen')
    .select('*')
    .limit(10000)

  const data = rekapData || []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <GisMapClient data={data} />
    </div>
  )
}
