'use client';

import React from 'react';
import { useDataSourceContext } from '@/components/DataSourceContext';
import { Loader2, Calendar } from 'lucide-react';

export function YearSelector() {
  const { activeSource, setActiveSource, availableSources, isLoading } = useDataSourceContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat Tahun...
      </div>
    );
  }

  if (availableSources.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
      <select
        value={activeSource?.id || ''}
        onChange={(e) => {
          const selected = availableSources.find((s) => s.id === e.target.value);
          if (selected) setActiveSource(selected);
        }}
        className="pl-9 pr-8 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none cursor-pointer shadow-sm transition-all"
      >
        {availableSources.map((source) => (
          <option key={source.id} value={source.id}>
            Tahun {source.tahun} {source.is_default ? '(Default)' : ''}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
}
