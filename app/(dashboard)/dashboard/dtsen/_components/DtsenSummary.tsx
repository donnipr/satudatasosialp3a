'use client'

import { useState, useMemo } from 'react'
import { Users, Home, Map, ChevronRight, BarChart3, TrendingUp, TrendingDown, Minus, CheckCircle, X } from 'lucide-react'

export function DtsenSummary({ data, prevData = [] }: { data: any[], prevData?: any[] }) {
  const [selectedKapanewon, setSelectedKapanewon] = useState<string | null>(null)
  const [selectedDeciles, setSelectedDeciles] = useState<string[]>([])

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

  // Calculate Trend Data per Kapanewon or Kalurahan
  const trendData = useMemo(() => {
    const currentStats: Record<string, number> = {};
    data.forEach(row => {
      if (selectedKapanewon && row.kecamatan !== selectedKapanewon) return;
      const key = selectedKapanewon ? row.kelurahan : row.kecamatan;
      if (!key) return;
      currentStats[key] = (currentStats[key] || 0) + (row.total_individu || 0);
    });

    const prevStats: Record<string, number> = {};
    prevData.forEach(row => {
      if (selectedKapanewon && row.kecamatan !== selectedKapanewon) return;
      const key = selectedKapanewon ? row.kelurahan : row.kecamatan;
      if (!key) return;
      prevStats[key] = (prevStats[key] || 0) + (row.total_individu || 0);
    });

    const trends = Object.keys(currentStats).map(name => {
      const current = currentStats[name];
      const prev = prevStats[name] || 0;
      let percentageChange = 0;
      let status: 'up' | 'down' | 'flat' | 'nodata' = 'nodata';

      if (prev > 0) {
        percentageChange = ((current - prev) / prev) * 100;
        if (percentageChange > 0) status = 'up';
        else if (percentageChange < 0) status = 'down';
        else status = 'flat';
      } else {
        status = 'nodata';
      }

      return {
        name,
        currentTotal: current,
        previousTotal: prev,
        percentageChange,
        status
      };
    });

    return trends.sort((a, b) => b.percentageChange - a.percentageChange);
  }, [data, prevData, selectedKapanewon]);

  return (
    <div className="space-y-4 mb-6">
      
      {/* Kapanewon Quick Filter & Stats */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Filter Analisis Kapanewon</h3>
            <p className="text-xs text-gray-500 mt-1">Pilih Kapanewon untuk melihat rincian desil secara spesifik.</p>
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
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedKapanewon(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              !selectedKapanewon 
                ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
            }`}
          >
            Semua (Kab. Gunungkidul)
          </button>
          {kapanewonStats.map(([name, pop]) => (
            <button
              key={name}
              onClick={() => setSelectedKapanewon(name)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 flex flex-col items-start gap-1 ${
                selectedKapanewon === name
                  ? 'bg-red-50 border-red-500 shadow-sm ring-1 ring-red-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span className={`font-bold ${selectedKapanewon === name ? 'text-red-700' : 'text-gray-900'}`}>{name}</span>
              <div className="flex gap-3 text-[11px]">
                <span className={`flex items-center gap-1 ${selectedKapanewon === name ? 'text-red-600' : 'text-gray-500'}`} title="Jumlah Keluarga">
                  <Home size={12} /> {pop.k.toLocaleString('id-ID')}
                </span>
                <span className={`flex items-center gap-1 ${selectedKapanewon === name ? 'text-red-600' : 'text-gray-500'}`} title="Jumlah Individu">
                  <Users size={12} /> {pop.i.toLocaleString('id-ID')}
                </span>
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
            { label: 'Desil 1', key: 'd1', k: totals.d1Keluarga, i: totals.d1Individu, color: 'border-red-200' },
            { label: 'Desil 2', key: 'd2', k: totals.d2Keluarga, i: totals.d2Individu, color: 'border-orange-200' },
            { label: 'Desil 3', key: 'd3', k: totals.d3Keluarga, i: totals.d3Individu, color: 'border-yellow-200' },
            { label: 'Desil 4', key: 'd4', k: totals.d4Keluarga, i: totals.d4Individu, color: 'border-green-200' },
            { label: 'Desil 5', key: 'd5', k: totals.d5Keluarga, i: totals.d5Individu, color: 'border-teal-200' },
            { label: 'Desil 6-10', key: 'd6_10', k: totals.d6_10Keluarga, i: totals.d6_10Individu, color: 'border-blue-200' },
            { label: 'Belum Peringkat', key: 'belumPeringkat', k: totals.belumPeringkatKeluarga, i: totals.belumPeringkatIndividu, color: 'border-gray-200' },
          ].map((item) => {
            const isSelected = selectedDeciles.includes(item.key);
            return (
              <button 
                key={item.key} 
                onClick={() => setSelectedDeciles(prev => prev.includes(item.key) ? prev.filter(k => k !== item.key) : [...prev, item.key])}
                className={`rounded-xl border p-4 flex flex-col justify-between text-left relative transition-all ${
                  isSelected 
                    ? 'ring-2 ring-red-500 bg-red-50/20 shadow-md border-transparent'
                    : `bg-white ${item.color} hover:shadow-md hover:border-red-300 shadow-sm`
                }`}
              >
                {isSelected && <CheckCircle size={16} className="text-red-500 absolute top-3 right-3" />}
                <h5 className="text-sm font-bold text-gray-800 mb-3 text-center border-b pb-2 border-gray-100 w-full">{item.label}</h5>
                <div className="space-y-2 w-full">
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
              </button>
            )
          })}
        </div>

      {/* Dynamic Banner */}
      {selectedDeciles.length > 0 && (() => {
        const selectedItems = [
          { label: 'Desil 1', key: 'd1', k: totals.d1Keluarga, i: totals.d1Individu },
          { label: 'Desil 2', key: 'd2', k: totals.d2Keluarga, i: totals.d2Individu },
          { label: 'Desil 3', key: 'd3', k: totals.d3Keluarga, i: totals.d3Individu },
          { label: 'Desil 4', key: 'd4', k: totals.d4Keluarga, i: totals.d4Individu },
          { label: 'Desil 5', key: 'd5', k: totals.d5Keluarga, i: totals.d5Individu },
          { label: 'Desil 6-10', key: 'd6_10', k: totals.d6_10Keluarga, i: totals.d6_10Individu },
          { label: 'Belum Peringkat', key: 'belumPeringkat', k: totals.belumPeringkatKeluarga, i: totals.belumPeringkatIndividu },
        ].filter(item => selectedDeciles.includes(item.key));
        
        const totalK = selectedItems.reduce((sum, item) => sum + item.k, 0);
        const totalI = selectedItems.reduce((sum, item) => sum + item.i, 0);
        const labels = selectedItems.map(item => item.label).join(', ');

        return (
          <div className="mt-6 p-4 bg-slate-800 text-white rounded-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between border-l-4 border-red-500 animate-in slide-in-from-bottom-4 gap-4">
            <div>
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">Total Kalkulasi Kustom</p>
              <h3 className="text-sm font-medium">Total untuk {labels}</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Keluarga</span>
                <span className="text-xl font-bold">{totalK.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Individu</span>
                <span className="text-xl font-bold">{totalI.toLocaleString('id-ID')}</span>
              </div>
              <button 
                onClick={() => setSelectedDeciles([])}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <X size={14} />
                Reset
              </button>
            </div>
          </div>
        )
      })()}
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-red-200 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="mr-2 text-red-600" size={20} />
            Grafik Distribusi Desil (Keluarga)
          </h3>
          <div className="flex justify-around items-end h-48 mt-4 border-b border-slate-200 pb-2">
            {[
              { label: 'Desil 1', value: totals.d1Keluarga || 0 },
              { label: 'Desil 2', value: totals.d2Keluarga || 0 },
              { label: 'Desil 3', value: totals.d3Keluarga || 0 },
              { label: 'Desil 4', value: totals.d4Keluarga || 0 },
              { label: 'Desil 5', value: totals.d5Keluarga || 0 },
            ].map((item, _, arr) => {
              const maxChartValue = Math.max(...arr.map(d => d.value)) || 1;
              const heightPercent = (item.value / maxChartValue) * 100;
              
              return (
                <div key={item.label} className="flex flex-col items-center gap-2 group w-1/5 h-full">
                  {/* Value Label on Top */}
                  <span className="text-xs font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.value.toLocaleString('id-ID')}
                  </span>
                  
                  {/* The Bar */}
                  <div className="w-full max-w-[40px] bg-red-50 rounded-t-md relative flex items-end justify-center h-full">
                    <div 
                      className="w-full bg-red-500 rounded-t-md transition-all duration-700 ease-out group-hover:bg-red-600" 
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                  </div>
                  
                  {/* X-Axis Label */}
                  <span className="text-sm font-medium text-slate-700 mt-2">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:border-red-200 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-red-600" size={20} />
            Tren Kenaikan/Penurunan per {selectedKapanewon ? 'Kalurahan' : 'Kapanewon'}
          </h3>
          
          <div className="flex-1 overflow-y-auto max-h-[220px] pr-2 space-y-3 custom-scrollbar">
            {trendData.map((kapanewon) => (
              <div key={kapanewon.name} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{kapanewon.name}</h4>
                  <p className="text-xs text-gray-500">Total Individu: {kapanewon.currentTotal.toLocaleString('id-ID')}</p>
                </div>
                
                {kapanewon.status === 'up' && (
                  <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">
                    <TrendingUp size={14} /> +{kapanewon.percentageChange.toFixed(1)}%
                  </div>
                )}
                {kapanewon.status === 'down' && (
                  <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                    <TrendingDown size={14} /> {kapanewon.percentageChange.toFixed(1)}%
                  </div>
                )}
                {kapanewon.status === 'flat' && (
                  <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold border border-gray-200">
                    <Minus size={14} /> Tetap
                  </div>
                )}
                {kapanewon.status === 'nodata' && (
                  <div className="flex items-center gap-1.5 bg-gray-50 text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-medium border border-gray-200">
                    Tidak ada data sebelumnya
                  </div>
                )}
              </div>
            ))}
            
            {trendData.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8">
                Tidak ada data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
