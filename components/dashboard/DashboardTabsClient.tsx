'use client';

import React, { useState } from 'react';
import { YearSelector } from '@/components/YearSelector';
import { DtsenOverview } from '@/components/dashboard/DtsenOverview';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { BansosOverview } from '@/components/dashboard/BansosOverview';
import { Users, PieChart, HeartHandshake } from 'lucide-react';

export function DashboardTabsClient({ data, currentTahun, currentPeriode }: { data: any[], currentTahun: number, currentPeriode: string }) {
  const [activeTab, setActiveTab] = useState<'dtsen' | 'budget' | 'bansos'>('dtsen');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">
            Pusat informasi dan ringkasan data eksekutif Kabupaten Gunungkidul.
          </p>
        </div>
        <div>
          <YearSelector />
        </div>
      </div>

      {/* Tabs Control */}
      <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg mb-2">
        <button
          onClick={() => setActiveTab('dtsen')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-all rounded-md ${
            activeTab === 'dtsen'
              ? 'bg-white shadow-sm text-slate-800 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={16} />
          Demografi DTSEN
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-all rounded-md ${
            activeTab === 'budget'
              ? 'bg-white shadow-sm text-slate-800 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <PieChart size={16} />
          Ringkasan Anggaran
        </button>
        <button
          onClick={() => setActiveTab('bansos')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-all rounded-md ${
            activeTab === 'bansos'
              ? 'bg-white shadow-sm text-slate-800 font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HeartHandshake size={16} />
          Distribusi Bansos
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'dtsen' && (
          <DtsenOverview data={data} currentTahun={currentTahun} currentPeriode={currentPeriode} />
        )}
        {activeTab === 'budget' && (
          <BudgetOverview />
        )}
        {activeTab === 'bansos' && (
          <BansosOverview />
        )}
      </div>
    </div>
  );
}
