'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchAndParseCSV, type CSVRow, SAMPLE_CSV_DATA } from '@/lib/mindmap/csv-to-tree';
import { Loader2, RefreshCw, Database, ChevronRight } from 'lucide-react';
import { useDataSourceContext } from '@/components/DataSourceContext';
import { YearSelector } from '@/components/YearSelector';

function val(value: string | undefined | null): string {
  if (!value || value.trim() === '' || value.trim() === '-') return '-';
  return value;
}

export default function ProgramDataPage() {
  const { activeSource, isLoading: isContextLoading } = useDataSourceContext();
  const [data, setData] = useState<CSVRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBidang, setExpandedBidang] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    if (isContextLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let result = null;
      if (activeSource?.url_csv) {
        result = await fetchAndParseCSV(activeSource.url_csv);
      }
      
      if (!result || result.length === 0) {
        result = SAMPLE_CSV_DATA;
      }
      setData(result);
    } catch (err) {
      console.error('Failed to load CSV:', err);
      setError('Gagal memuat data dari spreadsheet.');
      setData(SAMPLE_CSV_DATA); // Fallback so UI doesn't completely break
    } finally {
      setIsLoading(false);
    }
  }, [activeSource, isContextLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleBidang = (name: string) => {
    setExpandedBidang((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const groupedData = useMemo(() => {
    const bidangMap: Record<
      string,
      {
        bidangName: string;
        totalRincian: number;
        subKegiatans: Record<
          string,
          {
            subName: string;
            sumberAnggaran: string;
            items: CSVRow[];
          }
        >;
      }
    > = {};

    data.forEach((row) => {
      const bidang = val(row['Bidang']);
      const sub = val(row['Sub Kegiatan']);

      if (!bidangMap[bidang]) {
        bidangMap[bidang] = {
          bidangName: bidang,
          totalRincian: 0,
          subKegiatans: {},
        };
      }

      if (!bidangMap[bidang].subKegiatans[sub]) {
        bidangMap[bidang].subKegiatans[sub] = {
          subName: sub,
          sumberAnggaran: val(row['Sumber Anggaran']),
          items: [],
        };
      }

      bidangMap[bidang].subKegiatans[sub].items.push(row);
      bidangMap[bidang].totalRincian += 1;
    });

    return Object.values(bidangMap).map((b) => ({
      ...b,
      subKegiatans: Object.values(b.subKegiatans),
    }));
  }, [data]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-snug">
              Data Program Kegiatan
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Menampilkan data hierarki dan rincian kegiatan dari Google Sheets.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <YearSelector />
          <button
            onClick={loadData}
            disabled={isLoading || isContextLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all font-medium text-sm disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : 'text-slate-400'}`} />
            {isLoading ? 'Memuat...' : 'Segarkan Data'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {isLoading && data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
            <p className="text-sm font-medium text-slate-600">Mengambil data spreadsheet...</p>
          </div>
        ) : error && data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-red-200 bg-red-50/30 text-red-600 shadow-sm">
            <p className="font-semibold mb-2">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm shadow-sm"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Accordion List Container */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {groupedData.map((bidangGroup, idx) => (
                  <div key={idx} className="flex flex-col">
                    {/* Level 1: Bidang Parent Row */}
                    <div
                      onClick={() => toggleBidang(bidangGroup.bidangName)}
                      className="flex items-center justify-between p-4 border-b border-slate-200 hover:bg-slate-50 cursor-pointer bg-white transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <ChevronRight
                          className={`w-5 h-5 text-slate-400 transition-transform ${
                            expandedBidang[bidangGroup.bidangName] ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                          {bidangGroup.bidangName}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold shrink-0">
                        {bidangGroup.totalRincian} Rincian Kegiatan
                      </span>
                    </div>

                    {/* Level 2: Sub Kegiatan & Rincian (Expanded) */}
                    {expandedBidang[bidangGroup.bidangName] && (
                      <div className="bg-[#F8FAFC] border-b border-slate-200">
                        {bidangGroup.subKegiatans.map((subGroup, subIdx) => (
                          <div key={subIdx} className="flex flex-col">
                            {/* Sub Kegiatan Header */}
                            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-100/50">
                              <span className="text-xs font-bold text-slate-700">
                                {subGroup.subName}
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded shrink-0 ml-4">
                                {subGroup.sumberAnggaran}
                              </span>
                            </div>

                            {/* Rincian Kegiatan Items */}
                            <div className="flex flex-col">
                              {subGroup.items.map((item, itemIdx) => (
                                <div
                                  key={itemIdx}
                                  className="flex items-start gap-4 py-4 pr-6 pl-10 border-b border-slate-100/50 last:border-0"
                                >
                                  {/* L-shaped connector */}
                                  <div className="w-5 h-6 border-l-2 border-b-2 border-slate-300 rounded-bl-sm -mt-2 shrink-0" />
                                  
                                  <div className="flex flex-col flex-1 pb-2">
                                    {/* Title */}
                                    <h4 className="text-sm font-bold text-slate-800">{val(item['Rincian Kegiatan'])}</h4>
                                    
                                    {/* Sasaran & Capaian Fisik */}
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                      <span className="font-semibold text-slate-600">Target:</span> {val(item['Sasaran'])} <br/>
                                      <span className="font-semibold text-slate-600">Fisik:</span> <span className="text-slate-700">{val(item['Capaian Realisasi Fisik'])}</span>
                                    </p>

                                    {/* Financial Dashboard Card */}
                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm inline-flex">
                                      {/* Pagu */}
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pagu Anggaran</span>
                                        <span className="text-sm font-extrabold text-slate-800">{val(item['Pagu Anggaran'])}</span>
                                      </div>
                                      
                                      {/* Realisasi */}
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Realisasi Keuangan</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-extrabold text-emerald-600">{val(item['Capaian Realisasi Nominal'])}</span>
                                          {item['Capaian Realisasi Persentase'] && item['Capaian Realisasi Persentase'].trim() !== '' && item['Capaian Realisasi Persentase'].trim() !== '-' && (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                                              {item['Capaian Realisasi Persentase']}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Menampilkan {groupedData.length} Bidang ({data.length} Rincian)</span>
              {error && <span className="text-red-500">Terdapat error saat sinkronisasi sebagian data.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
