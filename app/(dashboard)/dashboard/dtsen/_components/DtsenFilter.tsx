'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function DtsenFilter({ currentTahun, currentPeriode }: { currentTahun: string, currentPeriode: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-4 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Tahun:</label>
        <select 
          value={currentTahun}
          onChange={(e) => handleFilterChange('tahun', e.target.value)}
          className="border border-gray-200 rounded-md text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {/* Generate some years based on current year */}
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - 2 + i
            return <option key={year} value={year}>{year}</option>
          })}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Periode:</label>
        <select 
          value={currentPeriode}
          onChange={(e) => handleFilterChange('periode', e.target.value)}
          className="border border-gray-200 rounded-md text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="Triwulan 1">Triwulan 1</option>
          <option value="Triwulan 2">Triwulan 2</option>
          <option value="Triwulan 3">Triwulan 3</option>
          <option value="Triwulan 4">Triwulan 4</option>
        </select>
      </div>
    </div>
  )
}
