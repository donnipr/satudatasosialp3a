'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'

// We wrap the map in a client component and dynamically import the actual implementation
// with ssr: false, because next/dynamic with ssr: false is only allowed inside Client Components.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 animate-pulse">
      <p className="text-gray-500 font-medium">Memuat Peta GIS...</p>
    </div>
  )
})

export default function GisMapClient({ data }: { data: any[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  // Extract unique periods and sort them descending
  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>()
    data.forEach(d => {
      if (d.tahun && d.periode) {
        periods.add(`${d.tahun} • ${d.periode}`)
      }
    })
    return Array.from(periods).sort((a, b) => b.localeCompare(a))
  }, [data])

  // Set initial selected period once unique periods are available
  useEffect(() => {
    if (uniquePeriods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(uniquePeriods[0])
    }
  }, [uniquePeriods, selectedPeriod])

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (!selectedPeriod) return []
    return data.filter(d => `${d.tahun} • ${d.periode}` === selectedPeriod)
  }, [data, selectedPeriod])

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Peta GIS (Geographic Information System)</h1>
        <p className="text-gray-500 mt-2">
          Visualisasi persebaran spasial DTSEN Kabupaten Gunungkidul.
        </p>
        
        <div className="flex items-center gap-2 mt-4 bg-gray-100/80 border border-gray-200 w-fit p-1.5 rounded-lg shadow-sm">
          <label htmlFor="period-select" className="text-sm font-medium text-slate-700 ml-2">Data Aktif:</label>
          <select 
            id="period-select"
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-gray-300 text-slate-900 text-sm font-semibold rounded-md focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5 cursor-pointer shadow-sm min-w-[150px] outline-none"
          >
            {uniquePeriods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6">
        <LeafletMap data={filteredData} selectedPeriod={selectedPeriod} />
      </div>
    </>
  )
}
