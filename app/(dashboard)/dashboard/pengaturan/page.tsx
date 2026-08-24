'use client';

import React, { useState } from 'react';
import { useDataSources } from '@/lib/hooks/useDataSources';
import { Settings, Plus, Loader2, Trash2, CheckCircle2, Circle } from 'lucide-react';

export default function PengaturanPage() {
  const { sources, isLoading, error, addSource, deleteSource, setDefaultSource } = useDataSources();
  const [tahun, setTahun] = useState('');
  const [urlCsv, setUrlCsv] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tahun || !urlCsv) return;
    
    setIsSubmitting(true);
    const res = await addSource(tahun, urlCsv);
    setIsSubmitting(false);
    
    if (res.success) {
      setTahun('');
      setUrlCsv('');
    } else {
      alert(`Gagal menambahkan: ${res.error}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-50 text-red-600 rounded-xl shadow-sm">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 leading-snug">Pengaturan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola sumber data master CSV untuk Dashboard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Add New */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tambah Sumber Data</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Tahun Anggaran</label>
                <input 
                  type="text" 
                  value={tahun}
                  onChange={e => setTahun(e.target.value)}
                  placeholder="Misal: 2024"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">URL Google Sheets CSV</label>
                <input 
                  type="url" 
                  value={urlCsv}
                  onChange={e => setUrlCsv(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !tahun || !urlCsv}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Simpan Data
              </button>
            </form>
          </div>
        </div>

        {/* List of Data Sources */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Daftar Sumber Data</h2>
            </div>
            
            <div className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
                  <p className="text-sm font-medium text-slate-600">Memuat data...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-600 bg-red-50/30">
                  <p>{error}</p>
                </div>
              ) : sources.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p>Belum ada sumber data yang ditambahkan.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {sources.map(source => (
                    <div key={source.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                      {/* Active Status */}
                      <button 
                        onClick={() => setDefaultSource(source.id)}
                        className={`mt-1 flex-shrink-0 focus:outline-none ${source.is_default ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}
                        title={source.is_default ? 'Aktif' : 'Jadikan Aktif'}
                      >
                        {source.is_default ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-bold text-slate-800">Tahun {source.tahun}</h3>
                          {source.is_default && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">DEFAULT</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate break-all bg-slate-100 p-2 rounded-md mt-2 font-mono">
                          {source.url_csv}
                        </p>
                      </div>

                      <div className="flex-shrink-0 pl-4 border-l border-slate-100">
                        <button
                          onClick={async () => {
                            if(confirm(`Yakin ingin menghapus data tahun ${source.tahun}?`)) {
                              await deleteSource(source.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
