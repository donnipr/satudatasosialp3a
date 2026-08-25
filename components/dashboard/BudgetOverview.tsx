'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchAndParseCSV, type CSVRow, SAMPLE_CSV_DATA } from '@/lib/mindmap/csv-to-tree';
import { useDataSourceContext } from '@/components/DataSourceContext';
import { Loader2, DollarSign, Activity, Target, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function parseRp(val: string | undefined | null): number {
  if (!val || val.trim() === '' || val.trim() === '-') return 0;
  // Remove 'Rp ', dots, spaces, etc
  const cleaned = val.replace(/Rp\s?/gi, '').replace(/\./g, '').replace(/,/g, '.').trim();
  return Number(cleaned) || 0;
}

const formatRp = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export function BudgetOverview() {
  const { activeSource, isLoading: isContextLoading } = useDataSourceContext();
  const [data, setData] = useState<CSVRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (isContextLoading) return;
      setIsLoading(true);
      try {
        let result = null;
        if (activeSource?.url_csv) {
          result = await fetchAndParseCSV(activeSource.url_csv);
        }
        if (!result || result.length === 0) {
          result = SAMPLE_CSV_DATA;
        }
        if (mounted) setData(result);
      } catch (err) {
        console.error('Failed to load CSV:', err);
        if (mounted) setData(SAMPLE_CSV_DATA);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [activeSource, isContextLoading]);

  // Aggregate Data
  const { totalPagu, totalRealisasi, totalKegiatan, chartData, pieData } = useMemo(() => {
    let tPagu = 0;
    let tRealisasi = 0;
    let tKegiatan = data.length;
    
    const bidangStats: Record<string, { pagu: number, realisasi: number }> = {};

    data.forEach(row => {
      const pagu = parseRp(row['Pagu Anggaran']);
      const realisasi = parseRp(row['Capaian Realisasi Nominal']);
      const bidang = (row['Bidang'] || 'Tanpa Bidang').trim();

      tPagu += pagu;
      tRealisasi += realisasi;

      if (!bidangStats[bidang]) {
        bidangStats[bidang] = { pagu: 0, realisasi: 0 };
      }
      bidangStats[bidang].pagu += pagu;
      bidangStats[bidang].realisasi += realisasi;
    });

    const cData = Object.entries(bidangStats).map(([name, stats]) => ({
      name,
      Pagu: stats.pagu,
      Realisasi: stats.realisasi
    })).sort((a, b) => b.Pagu - a.Pagu);

    const pData = cData.map(item => ({
      name: item.name,
      value: item.Pagu
    }));

    return { totalPagu: tPagu, totalRealisasi: tRealisasi, totalKegiatan: tKegiatan, chartData: cData, pieData: pData };
  }, [data]);

  const persentase = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  if (isLoading || isContextLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
        <p className="text-sm font-medium text-slate-600">Menghitung Data Anggaran...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Cards - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Pagu</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{formatRp(totalPagu)}</h2>
            <p className="text-xs text-slate-500 mt-1">Anggaran Tahun Ini</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Realisasi</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{formatRp(totalRealisasi)}</h2>
            <p className="text-xs text-slate-500 mt-1">Realisasi Keuangan</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Capaian %</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Target size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{persentase.toFixed(2)}%</h2>
            <p className="text-xs text-slate-500 mt-1">Dari Total Pagu</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Kegiatan</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layers size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{totalKegiatan}</h2>
            <p className="text-xs text-slate-500 mt-1">Rincian Kegiatan (Baris)</p>
          </div>
        </div>
      </div>

      {/* Charts - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Pagu vs Realisasi per Bidang */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Pagu vs Realisasi Per Bidang</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip 
                  formatter={(val: number) => formatRp(val)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="Pagu" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Realisasi" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie/Doughnut Chart: Pagu Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribusi Pagu Per Bidang</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(val: number) => formatRp(val)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
