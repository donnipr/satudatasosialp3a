'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Target, FileText, PieChart, Store, Activity, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface KPIPerlinsosData {
  kapanewon: string;
  kalurahan: string;
  jumlah_keluarga: number;
  desil_1_5: number;
  total_pendaftar: number;
  agen: number;
  agen_aktif: number;
}

export default function AnalisisKPIPage() {
  const [data, setData] = useState<KPIPerlinsosData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: result, error: fetchError } = await supabase
          .from('view_kpi_perlinsos')
          .select('*');

        if (fetchError) throw fetchError;
        setData(result || []);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { metrics, chartData, lowestCoverage, mostInactiveAgents } = useMemo(() => {
    let totalRentan = 0;
    let totalPendaftar = 0;
    let totalAgen = 0;
    let totalAgenAktif = 0;

    const kapanewonMap: Record<string, { desil_1_5: number; total_pendaftar: number; agen: number; agen_aktif: number }> = {};

    data.forEach((row) => {
      totalRentan += Number(row.desil_1_5 || 0);
      totalPendaftar += Number(row.total_pendaftar || 0);
      totalAgen += Number(row.agen || 0);
      totalAgenAktif += Number(row.agen_aktif || 0);

      if (!kapanewonMap[row.kapanewon]) {
        kapanewonMap[row.kapanewon] = { desil_1_5: 0, total_pendaftar: 0, agen: 0, agen_aktif: 0 };
      }
      kapanewonMap[row.kapanewon].desil_1_5 += Number(row.desil_1_5 || 0);
      kapanewonMap[row.kapanewon].total_pendaftar += Number(row.total_pendaftar || 0);
      kapanewonMap[row.kapanewon].agen += Number(row.agen || 0);
      kapanewonMap[row.kapanewon].agen_aktif += Number(row.agen_aktif || 0);
    });

    const coverageRate = totalRentan > 0 ? (totalPendaftar / totalRentan) * 100 : 0;
    const agenAktifRate = totalAgen > 0 ? (totalAgenAktif / totalAgen) * 100 : 0;

    const chartDataArray = Object.entries(kapanewonMap).map(([name, vals]) => {
      const coverage = vals.desil_1_5 > 0 ? (vals.total_pendaftar / vals.desil_1_5) * 100 : 0;
      const inaktif = vals.agen - vals.agen_aktif;
      return {
        kapanewon: name,
        targetRentan: vals.desil_1_5,
        pendaftar: vals.total_pendaftar,
        coverage: coverage,
        agen: vals.agen,
        agenAktif: vals.agen_aktif,
        agenInaktif: inaktif > 0 ? inaktif : 0,
      };
    });

    // Lowest Coverage Top 5
    const lowestCoverageArray = [...chartDataArray]
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 5);

    // Most Inactive Agents Top 5
    const mostInactiveAgentsArray = [...chartDataArray]
      .sort((a, b) => b.agenInaktif - a.agenInaktif)
      .slice(0, 5);

    return {
      metrics: { totalRentan, totalPendaftar, coverageRate, totalAgen, totalAgenAktif, agenAktifRate },
      chartData: chartDataArray,
      lowestCoverage: lowestCoverageArray,
      mostInactiveAgents: mostInactiveAgentsArray,
    };
  }, [data]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Analisis KPI Perlinsos & Agen</h1>
        <p className="text-base text-gray-500 max-w-3xl">
          Visualisasi interaktif mengenai capaian target kelompok rentan dan kesiapan agen. Analisis ini membantu mengidentifikasi area yang membutuhkan intervensi prioritas.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Section 1: Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Rentan</h3>
                <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalRentan.toLocaleString('id-ID')}</span>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pendaftar</h3>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalPendaftar.toLocaleString('id-ID')}</span>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cakupan</h3>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.coverageRate.toFixed(1)}%</span>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Agen</h3>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalAgen.toLocaleString('id-ID')}</span>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Agen Aktif</h3>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalAgenAktif.toLocaleString('id-ID')}</span>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keaktifan Agen</h3>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.agenAktifRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Section 2: Interactive Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pendaftaran: Target vs Aktual</h3>
                <p className="text-sm text-gray-500">Perbandingan jumlah target kelompok rentan (Desil 1-5) dengan jumlah pendaftar per kapanewon.</p>
              </div>
              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="kapanewon" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="targetRentan" name="Target Rentan" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="pendaftar" name="Pendaftar" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kesiapan Agen: Total vs Aktif</h3>
                <p className="text-sm text-gray-500">Perbandingan jumlah total agen terdaftar dengan jumlah agen yang saat ini aktif beroperasi.</p>
              </div>
              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="kapanewon" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="agen" name="Total Agen" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="agenAktif" name="Agen Aktif" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section 3: Actionable Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Table 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-red-50/30">
                <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Top 5 Kapanewon Cakupan Terendah
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Kapanewon</th>
                      <th className="px-5 py-3 font-semibold text-right">Target</th>
                      <th className="px-5 py-3 font-semibold text-right">Pendaftar</th>
                      <th className="px-5 py-3 font-semibold text-right">% Cakupan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lowestCoverage.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-gray-500">Tidak ada data</td>
                      </tr>
                    ) : (
                      lowestCoverage.map((item, index) => {
                        const isCritical = item.coverage < 50;
                        return (
                          <tr key={item.kapanewon} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 font-bold text-[10px]">
                                {index + 1}
                              </span>
                              {item.kapanewon}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums">{item.targetRentan.toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-right tabular-nums">{item.pendaftar.toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-right font-bold tabular-nums">
                              <span className={`px-2 py-1 rounded text-xs ${isCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {item.coverage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-amber-50/30">
                <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Top 5 Kapanewon Agen Inaktif Terbanyak
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Kapanewon</th>
                      <th className="px-5 py-3 font-semibold text-right">Total Agen</th>
                      <th className="px-5 py-3 font-semibold text-right">Agen Aktif</th>
                      <th className="px-5 py-3 font-semibold text-right">Agen Inaktif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mostInactiveAgents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-gray-500">Tidak ada data</td>
                      </tr>
                    ) : (
                      mostInactiveAgents.map((item, index) => {
                        const isCritical = item.agenInaktif > 5;
                        return (
                          <tr key={item.kapanewon} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 font-bold text-[10px]">
                                {index + 1}
                              </span>
                              {item.kapanewon}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums">{item.agen.toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-right tabular-nums text-emerald-600">{item.agenAktif.toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-right font-bold tabular-nums">
                              <span className={`px-2 py-1 rounded text-xs ${isCritical ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                {item.agenInaktif.toLocaleString('id-ID')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
