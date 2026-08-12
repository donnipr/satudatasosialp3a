'use client'

import { useState, useMemo } from 'react'
import { Users, Home, MapPin, ChevronRight, Map, BarChart3 } from 'lucide-react'

export function DashboardClient({ data, currentTahun, currentPeriode }: { data: any[], currentTahun: number, currentPeriode: string }) {
  const [selectedKapanewon, setSelectedKapanewon] = useState<string | null>(null)

  // Get unique Kapanewon list and calculate their individual totals
  const kapanewonStats = useMemo(() => {
    const stats: Record<string, { k: number, i: number }> = {}
    data.forEach(row => {
      if (!row.kecamatan) return
      if (!stats[row.kecamatan]) stats[row.kecamatan] = { k: 0, i: 0 }
      stats[row.kecamatan].k += (row.total_keluarga || 0)
      stats[row.kecamatan].i += (row.total_individu || 0)
    })
    return Object.entries(stats).sort((a, b) => b[1].i - a[1].i) // Sort by highest population
  }, [data])

  // Filter data for the main summary cards
  const filteredData = useMemo(() => {
    if (!selectedKapanewon) return data
    return data.filter(d => d.kecamatan === selectedKapanewon)
  }, [data, selectedKapanewon])

  const totalKapanewon = new Set(filteredData.map(d => d.kecamatan).filter(Boolean)).size
  const totalKalurahan = new Set(filteredData.map(d => d.kelurahan).filter(Boolean)).size

  const totals = filteredData.reduce((acc, row) => {
    acc.totalKeluarga += row.total_keluarga || 0
    acc.totalIndividu += row.total_individu || 0
    acc.d1Keluarga += row.d1_keluarga || 0
    acc.d1Individu += row.d1_individu || 0
    acc.d2Keluarga += row.d2_keluarga || 0
    acc.d2Individu += row.d2_individu || 0
    acc.d3Keluarga += row.d3_keluarga || 0
    acc.d3Individu += row.d3_individu || 0
    acc.d4Keluarga += row.d4_keluarga || 0
    acc.d4Individu += row.d4_individu || 0
    acc.d5Keluarga += row.d5_keluarga || 0
    acc.d5Individu += row.d5_individu || 0
    acc.d6_10Keluarga += row.d6_10_keluarga || 0
    acc.d6_10Individu += row.d6_10_individu || 0
    acc.belumPeringkatKeluarga += row.belum_peringkat_keluarga || 0
    acc.belumPeringkatIndividu += row.belum_peringkat_individu || 0
    return acc
  }, {
    totalKeluarga: 0, totalIndividu: 0,
    d1Keluarga: 0, d1Individu: 0,
    d2Keluarga: 0, d2Individu: 0,
    d3Keluarga: 0, d3Individu: 0,
    d4Keluarga: 0, d4Individu: 0,
    d5Keluarga: 0, d5Individu: 0,
    d6_10Keluarga: 0, d6_10Individu: 0,
    belumPeringkatKeluarga: 0, belumPeringkatIndividu: 0
  })

  return (
    <div className="space-y-6">
      
      {/* Dashboard Title & Meta */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2">
          Menampilkan data terbaru dari rekapitulasi DTSEN Kabupaten Gunungkidul.
        </p>
        <div className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg border border-gray-200">
          Tahun: {currentTahun} • {currentPeriode}
        </div>
      </div>

      {/* Kapanewon Quick Filter & Stats */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Filter Analisis Kapanewon</h3>
            <p className="text-xs text-gray-500 mt-1">Pilih Kapanewon untuk melihat metrik spesifik.</p>
          </div>
          {selectedKapanewon && (
            <button 
              onClick={() => setSelectedKapanewon(null)}
              className="text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Reset ke Semua Kapanewon
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-4">
          <button
            onClick={() => setSelectedKapanewon(null)}
            className={`p-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-center h-full min-h-[100px] ${
              !selectedKapanewon 
                ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-200 ring-offset-2' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:shadow-sm'
            }`}
          >
            <span className="font-bold text-base leading-tight mb-1">Semua Kapanewon</span>
            <span className={`text-xs ${!selectedKapanewon ? 'text-red-100' : 'text-gray-500'}`}>
              Kabupaten Gunungkidul
            </span>
          </button>
          
          {kapanewonStats.map(([name, pop]) => (
            <button
              key={name}
              onClick={() => setSelectedKapanewon(name)}
              className={`p-4 rounded-xl text-left border transition-all duration-200 flex flex-col h-full min-h-[100px] justify-between ${
                selectedKapanewon === name
                  ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-200 ring-offset-2'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <span className={`font-bold text-sm mb-3 leading-tight ${selectedKapanewon === name ? 'text-red-700' : 'text-gray-900'}`}>{name}</span>
              <div className="flex flex-col gap-2 text-xs w-full">
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 font-medium ${selectedKapanewon === name ? 'text-red-600' : 'text-gray-500'}`} title="Jumlah Keluarga">
                    <Home size={14} /> Kel:
                  </span>
                  <span className={`font-semibold ${selectedKapanewon === name ? 'text-red-700' : 'text-gray-700'}`}>{pop.k.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 font-medium ${selectedKapanewon === name ? 'text-red-600' : 'text-gray-500'}`} title="Jumlah Individu">
                    <Users size={14} /> Ind:
                  </span>
                  <span className={`font-semibold ${selectedKapanewon === name ? 'text-red-700' : 'text-gray-700'}`}>{pop.i.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb Context */}
      <div className="flex items-center text-gray-500 text-sm font-medium px-1">
        <span>Kabupaten Gunungkidul</span>
        {selectedKapanewon && (
          <>
            <ChevronRight size={14} className="mx-1" />
            <span className="text-red-600">Kapanewon {selectedKapanewon}</span>
          </>
        )}
      </div>

      {/* Top Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Wilayah */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Wilayah Aktif</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">{selectedKapanewon ? totalKalurahan : totalKapanewon}</span>
              <span className="text-sm font-medium text-gray-500">
                {selectedKapanewon ? 'Kalurahan' : 'Kapanewon'}
              </span>
            </div>
            {!selectedKapanewon && (
              <div className="text-sm text-gray-500 mt-1">
                {totalKalurahan} Kalurahan
              </div>
            )}
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <Map size={24} />
          </div>
        </div>

        {/* Total Keluarga */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Jumlah Keluarga</p>
            <h3 className="text-3xl font-bold text-gray-900">{totals.totalKeluarga.toLocaleString('id-ID')}</h3>
            <p className="text-sm text-green-600 font-medium mt-1">
              {selectedKapanewon ? `Terdata di ${selectedKapanewon}` : 'Total Terdata (Kabupaten)'}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <Home size={24} />
          </div>
        </div>

        {/* Total Individu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Jumlah Individu</p>
            <h3 className="text-3xl font-bold text-gray-900">{totals.totalIndividu.toLocaleString('id-ID')}</h3>
            <p className="text-sm text-green-600 font-medium mt-1">
              {selectedKapanewon ? `Terdata di ${selectedKapanewon}` : 'Total Terdata (Kabupaten)'}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <Users size={24} />
          </div>
        </div>

      </div>

      {/* Desil Breakdown Grid */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 px-1 mt-2">
          Rincian Data Peringkat {selectedKapanewon ? `(${selectedKapanewon})` : ''}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Desil 1', k: totals.d1Keluarga, i: totals.d1Individu, color: 'border-red-200 bg-white' },
            { label: 'Desil 2', k: totals.d2Keluarga, i: totals.d2Individu, color: 'border-orange-200 bg-white' },
            { label: 'Desil 3', k: totals.d3Keluarga, i: totals.d3Individu, color: 'border-yellow-200 bg-white' },
            { label: 'Desil 4', k: totals.d4Keluarga, i: totals.d4Individu, color: 'border-green-200 bg-white' },
            { label: 'Desil 5', k: totals.d5Keluarga, i: totals.d5Individu, color: 'border-teal-200 bg-white' },
            { label: 'Desil 6-10', k: totals.d6_10Keluarga, i: totals.d6_10Individu, color: 'border-blue-200 bg-white' },
            { label: 'Belum Peringkat', k: totals.belumPeringkatKeluarga, i: totals.belumPeringkatIndividu, color: 'border-gray-200 bg-gray-50' },
          ].map((item, idx) => (
            <div key={idx} className={`rounded-xl border ${item.color} p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}>
              <h5 className="text-sm font-bold text-gray-800 mb-3 text-center border-b pb-2 border-gray-100">{item.label}</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <Home size={12} className="text-gray-400" /> Keluarga
                  </span>
                  <span className="font-semibold text-gray-900">{item.k.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <Users size={12} className="text-gray-400" /> Individu
                  </span>
                  <span className="font-semibold text-gray-900">{item.i.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Charts Placeholder */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Visualisasi Distribusi</h2>
          <div className="p-2 bg-gray-50 text-gray-400 rounded-lg">
            <BarChart3 size={20} />
          </div>
        </div>
        
        <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Grafik Data {selectedKapanewon || 'Kabupaten'} akan ditampilkan di sini</p>
            <p className="text-sm text-gray-400 mt-1">Sistem dinamis sudah terhubung dengan filter area</p>
          </div>
        </div>
      </div>

    </div>
  )
}
