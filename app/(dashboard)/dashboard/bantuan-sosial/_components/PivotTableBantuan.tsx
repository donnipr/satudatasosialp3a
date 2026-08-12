import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Map, Filter, Search, Database } from 'lucide-react';

interface PivotTableBantuanProps {
  data: any[];
  masterData: any[];
}

export default function PivotTableBantuan({ data, masterData }: PivotTableBantuanProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // Filter Mode State
  const [filterMode, setFilterMode] = useState<'program' | 'waktu'>('program');

  // Input states (not applied yet)
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('Semua');
  const [selectedProgram, setSelectedProgram] = useState<string>('Semua');

  // Applied states (used for filtering)
  const [appliedTahun, setAppliedTahun] = useState<string>('Semua');
  const [appliedPeriode, setAppliedPeriode] = useState<string>('Semua');
  const [appliedProgram, setAppliedProgram] = useState<string>('Semua');

  // Reset inputs when mode changes
  useEffect(() => {
    setSelectedTahun('Semua');
    setSelectedPeriode('Semua');
    setSelectedProgram('Semua');
  }, [filterMode]);

  // --- CASCADING LOGIC BASED ON MODE --- //
  
  const availablePrograms = useMemo(() => {
    let filtered = data;
    if (filterMode === 'waktu') {
      if (selectedTahun !== 'Semua') {
        filtered = filtered.filter(item => item.tahun?.toString() === selectedTahun);
      }
      if (selectedPeriode !== 'Semua') {
        filtered = filtered.filter(item => item.periode === selectedPeriode);
      }
    }
    const uniquePrograms = Array.from(new Set(filtered.map(item => item.nama_program).filter(Boolean)));
    return uniquePrograms.sort();
  }, [data, filterMode, selectedTahun, selectedPeriode]);

  const availableTahun = useMemo(() => {
    let filtered = data;
    if (filterMode === 'program') {
      if (selectedProgram !== 'Semua') {
        filtered = filtered.filter(item => item.nama_program === selectedProgram);
      }
    }
    const uniqueTahun = Array.from(new Set(filtered.map(item => item.tahun?.toString()).filter(Boolean)));
    return uniqueTahun.sort((a, b) => b.localeCompare(a));
  }, [data, filterMode, selectedProgram]);

  const availablePeriode = useMemo(() => {
    let filtered = data;
    if (filterMode === 'program') {
      if (selectedProgram !== 'Semua') {
        filtered = filtered.filter(item => item.nama_program === selectedProgram);
      }
      if (selectedTahun !== 'Semua') {
        filtered = filtered.filter(item => item.tahun?.toString() === selectedTahun);
      }
    } else {
      if (selectedTahun !== 'Semua') {
        filtered = filtered.filter(item => item.tahun?.toString() === selectedTahun);
      }
    }
    const uniquePeriode = Array.from(new Set(filtered.map(item => item.periode).filter(Boolean)));
    return uniquePeriode.sort();
  }, [data, filterMode, selectedProgram, selectedTahun]);

  // Auto-Reset Logic for cascading dropdowns
  useEffect(() => {
    if (selectedProgram !== 'Semua' && !availablePrograms.includes(selectedProgram)) {
      setSelectedProgram('Semua');
    }
  }, [availablePrograms, selectedProgram]);

  useEffect(() => {
    if (selectedTahun !== 'Semua' && !availableTahun.includes(selectedTahun)) {
      setSelectedTahun('Semua');
    }
  }, [availableTahun, selectedTahun]);

  useEffect(() => {
    if (selectedPeriode !== 'Semua' && !availablePeriode.includes(selectedPeriode)) {
      setSelectedPeriode('Semua');
    }
  }, [availablePeriode, selectedPeriode]);

  // --- COMPONENT LOGIC --- //

  const toggleRow = (kapanewon: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(kapanewon)) {
      newExpanded.delete(kapanewon);
    } else {
      newExpanded.add(kapanewon);
    }
    setExpandedRows(newExpanded);
  };

  const handleSearch = () => {
    setAppliedTahun(selectedTahun);
    setAppliedPeriode(selectedPeriode);
    setAppliedProgram(selectedProgram);
    setHasSearched(true);
  };

  // Group and Aggregate logic based on APPLIED filters
  const pivotData = useMemo(() => {
    if (!hasSearched) return { rows: [], grandTotal: 0, maxTotal: 0, totalKalurahan: 0 };

    const result: Record<string, { total: number; kalurahans: Record<string, number> }> = {};
    let grandTotal = 0;

    const filteredData = data.filter(item => {
      const matchTahun = appliedTahun === "Semua" || item.tahun?.toString() === appliedTahun;
      const matchPeriode = appliedPeriode === "Semua" || item.periode === appliedPeriode;
      const matchProgram = appliedProgram === "Semua" || item.nama_program === appliedProgram;
      return matchTahun && matchPeriode && matchProgram;
    });

    filteredData.forEach((row) => {
      const kap = row.kapanewon || 'Tidak Diketahui';
      const kal = row.kalurahan || 'Tidak Diketahui';
      const jumlah = parseInt(row.jumlah) || 0;

      if (!result[kap]) {
        result[kap] = { total: 0, kalurahans: {} };
      }
      
      if (!result[kap].kalurahans[kal]) {
        result[kap].kalurahans[kal] = 0;
      }

      result[kap].total += jumlah;
      result[kap].kalurahans[kal] += jumlah;
      grandTotal += jumlah;
    });

    // Sort Kapanewon alphabetically
    let maxTotal = 0;
    let totalKalurahan = 0;
    
    const sortedResult = Object.entries(result)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([kapName, kapData]) => {
        if (kapData.total > maxTotal) maxTotal = kapData.total;
        totalKalurahan += Object.keys(kapData.kalurahans).length;
        
        return {
          kapanewon: kapName,
          total: kapData.total,
          // Sort Kalurahan alphabetically
          kalurahans: Object.entries(kapData.kalurahans)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([kalName, kalJumlah]) => ({
              kalurahan: kalName,
              jumlah: kalJumlah
            }))
        };
      });

    return { rows: sortedResult, grandTotal, maxTotal, totalKalurahan };
  }, [data, appliedTahun, appliedPeriode, appliedProgram, hasSearched]);

  // --- RENDER HELPERS --- //

  const renderProgramDropdown = (label: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select 
        value={selectedProgram}
        onChange={(e) => setSelectedProgram(e.target.value)}
        disabled={availablePrograms.length === 0}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
      >
        {availablePrograms.length === 0 ? (
          <option value="Semua">Tidak ada program tersedia</option>
        ) : (
          <>
            <option value="Semua">Semua Program</option>
            {availablePrograms.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
          </>
        )}
      </select>
    </div>
  );

  const renderWaktuDropdowns = (label: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="flex flex-col gap-3">
        <div>
          <select 
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            disabled={availableTahun.length === 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
          >
            {availableTahun.length === 0 ? (
              <option value="Semua">Tidak ada tahun tersedia</option>
            ) : (
              <>
                <option value="Semua">Semua Tahun</option>
                {availableTahun.map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
              </>
            )}
          </select>
        </div>
        <div>
          <select 
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            disabled={availablePeriode.length === 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
          >
            {availablePeriode.length === 0 ? (
              <option value="Semua">Tidak ada periode tersedia</option>
            ) : (
              <>
                <option value="Semua">Semua Periode</option>
                {availablePeriode.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
              </>
            )}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Filter Pencarian */}
      <div className="col-span-12 md:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-24">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-slate-800">Filter Pencarian</h2>
          </div>
          
          <div className="p-4 space-y-4">
            
            {/* Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setFilterMode('program')}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${filterMode === 'program' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}
              >
                Program
              </button>
              <button 
                onClick={() => setFilterMode('waktu')}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${filterMode === 'waktu' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}
              >
                Waktu
              </button>
            </div>

            {/* Dynamic Rendering Based on Mode */}
            {filterMode === 'program' ? (
              <>
                {renderProgramDropdown('1. Program')}
                <hr className="border-slate-100" />
                {renderWaktuDropdowns('2. Waktu')}
              </>
            ) : (
              <>
                {renderWaktuDropdowns('1. Waktu')}
                <hr className="border-slate-100" />
                {renderProgramDropdown('2. Program')}
              </>
            )}

          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Search size={16} />
              Cari Data
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Hasil Pencarian */}
      <div className="col-span-12 md:col-span-9">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Map className="text-red-600" size={20} />
              Hasil Pencarian
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan rekapitulasi data berdasarkan filter yang dipilih.
            </p>
          </div>

          {!hasSearched ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 border-8 border-blue-100/50">
                <Database size={40} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-500 max-w-md">
                Silakan gunakan panel filter di sebelah kiri dan klik <strong>'Cari Data'</strong> untuk menampilkan rekapitulasi wilayah.
              </p>
            </div>
          ) : (
            /* Results State */
            <div className="flex-1">
              <div className="p-4 sm:p-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Bantuan / Penerima</p>
                    <h3 className="text-2xl font-bold text-gray-900">{(pivotData.grandTotal || 0).toLocaleString('id-ID')}</h3>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-1">Kapanewon Terlibat</p>
                    <h3 className="text-2xl font-bold text-gray-900">{pivotData.rows.length}</h3>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-1">Kalurahan Terlibat</p>
                    <h3 className="text-2xl font-bold text-gray-900">{pivotData.totalKalurahan}</h3>
                  </div>
                </div>

                {/* Pivot Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 font-semibold w-2/3">Wilayah</th>
                          <th className="px-6 py-4 font-semibold text-right w-1/3">Total Bantuan / Penerima</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pivotData.rows.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                              Data tidak ditemukan untuk filter ini.
                            </td>
                          </tr>
                        ) : (
                          pivotData.rows.map((row) => {
                            const isExpanded = expandedRows.has(row.kapanewon);
                            return (
                              <React.Fragment key={row.kapanewon}>
                                {/* Parent Row (Kapanewon) */}
                                <tr 
                                  onClick={() => toggleRow(row.kapanewon)}
                                  className="hover:bg-gray-50 cursor-pointer transition-colors bg-gray-50/30"
                                >
                                  <td className="px-6 py-3 font-semibold text-gray-900 flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown size={18} className="text-gray-400" />
                                    ) : (
                                      <ChevronRight size={18} className="text-gray-400" />
                                    )}
                                    {row.kapanewon}
                                  </td>
                                  <td className="p-0 font-semibold text-gray-900 w-1/3">
                                    <div className="relative flex items-center justify-end w-full h-full py-3 pr-6 min-h-[44px]">
                                      <div 
                                        className="absolute right-0 top-0 bottom-0 bg-red-100 rounded-l transition-all duration-500 ease-out" 
                                        style={{ width: pivotData.maxTotal > 0 ? `${(row.total / pivotData.maxTotal) * 100}%` : '0%', zIndex: 0, opacity: 0.8 }}
                                      />
                                      <span className="relative z-10">{(row.total || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                  </td>
                                </tr>

                                {/* Child Rows (Kalurahan) */}
                                {isExpanded && row.kalurahans.map((kal) => (
                                  <tr key={kal.kalurahan} className="hover:bg-red-50/30 transition-colors">
                                    <td className="py-3 pr-6 pl-14 text-gray-700 flex items-center gap-2 border-l-2 border-transparent">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                      {kal.kalurahan}
                                    </td>
                                    <td className="px-6 py-3 text-gray-700 text-right">
                                      {(kal.jumlah || 0).toLocaleString('id-ID')}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })
                        )}
                        
                        {/* Footer Row (Grand Total) */}
                        {pivotData.rows.length > 0 && (
                          <tr className="bg-red-50/50 border-t-2 border-gray-200">
                            <td className="px-6 py-4 font-bold text-gray-900 text-right">
                              GRAND TOTAL
                            </td>
                            <td className="px-6 py-4 font-bold text-red-700 text-right text-base">
                              {(pivotData.grandTotal || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
