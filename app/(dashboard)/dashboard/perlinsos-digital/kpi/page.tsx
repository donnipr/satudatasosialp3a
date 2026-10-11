'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Target, FileText, PieChart, Store, Activity, CheckCircle, AlertCircle, Loader2, Users, HeartHandshake } from 'lucide-react';
import { ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine, Cell } from 'recharts';

interface KPIPerlinsosData {
  kapanewon: string;
  kalurahan: string;
  jumlah_keluarga: number;
  desil_1_5: number;
  kk_daftar?: number;
  total_pendaftar?: number;
  penerima_bpnt: number;
  bpnt_daftar?: number;
  penerima_pkh: number;
  pkh_daftar?: number;
  agen: number;
  agen_aktif: number;
  kk_via_agen?: number;
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

  const { metrics, chartData, lowestCoverage, mostInactiveAgents, lowestKalurahan, kpiQuadrantData } = useMemo(() => {
    let totalKeluarga = 0;
    let totalRentan = 0;
    let totalKKDaftar = 0;
    let totalBPNTDaftar = 0;
    let totalPenerimaBPNT = 0;
    let totalPKHDaftar = 0;
    let totalPenerimaPKH = 0;
    let totalAgen = 0;
    let totalAgenAktif = 0;
    let totalKKViaAgen = 0;

    const kapanewonMap: Record<string, { 
      jumlah_keluarga: number;
      desil_1_5: number; 
      kk_daftar: number; 
      bpnt_daftar: number;
      penerima_bpnt: number; 
      pkh_daftar: number;
      penerima_pkh: number; 
      agen: number; 
      agen_aktif: number; 
      kk_via_agen: number;
    }> = {};

    data.forEach((row) => {
      const jmlKeluarga = Number(row.jumlah_keluarga || 0);
      const desil15 = Number(row.desil_1_5 || 0);
      const kkDaftar = Number(row.kk_daftar ?? row.total_pendaftar ?? 0);
      const bpntDaftar = Number(row.bpnt_daftar || 0);
      const penerimaBpnt = Number(row.penerima_bpnt || 0);
      const pkhDaftar = Number(row.pkh_daftar || 0);
      const penerimaPkh = Number(row.penerima_pkh || 0);
      const agen = Number(row.agen || 0);
      const agenAktif = Number(row.agen_aktif || 0);
      const kkViaAgen = Number(row.kk_via_agen || 0);

      totalKeluarga += jmlKeluarga;
      totalRentan += desil15;
      totalKKDaftar += kkDaftar;
      totalBPNTDaftar += bpntDaftar;
      totalPenerimaBPNT += penerimaBpnt;
      totalPKHDaftar += pkhDaftar;
      totalPenerimaPKH += penerimaPkh;
      totalAgen += agen;
      totalAgenAktif += agenAktif;
      totalKKViaAgen += kkViaAgen;

      if (!kapanewonMap[row.kapanewon]) {
        kapanewonMap[row.kapanewon] = { 
          jumlah_keluarga: 0,
          desil_1_5: 0, 
          kk_daftar: 0, 
          bpnt_daftar: 0,
          penerima_bpnt: 0, 
          pkh_daftar: 0,
          penerima_pkh: 0, 
          agen: 0, 
          agen_aktif: 0, 
          kk_via_agen: 0 
        };
      }
      kapanewonMap[row.kapanewon].jumlah_keluarga += jmlKeluarga;
      kapanewonMap[row.kapanewon].desil_1_5 += desil15;
      kapanewonMap[row.kapanewon].kk_daftar += kkDaftar;
      kapanewonMap[row.kapanewon].bpnt_daftar += bpntDaftar;
      kapanewonMap[row.kapanewon].penerima_bpnt += penerimaBpnt;
      kapanewonMap[row.kapanewon].pkh_daftar += pkhDaftar;
      kapanewonMap[row.kapanewon].penerima_pkh += penerimaPkh;
      kapanewonMap[row.kapanewon].agen += agen;
      kapanewonMap[row.kapanewon].agen_aktif += agenAktif;
      kapanewonMap[row.kapanewon].kk_via_agen += kkViaAgen;
    });

    const coverageRate = totalRentan > 0 ? (totalKKDaftar / totalRentan) * 100 : 0;
    const populasiRate = totalKeluarga > 0 ? (totalKKDaftar / totalKeluarga) * 100 : 0;
    const agenAktifRate = totalAgen > 0 ? (totalAgenAktif / totalAgen) * 100 : 0;
    const agenKinerjaRate = totalKKDaftar > 0 ? (totalKKViaAgen / totalKKDaftar) * 100 : 0;

    const pkhRate = totalPenerimaPKH > 0 ? (totalPKHDaftar / totalPenerimaPKH) * 100 : 0;
    const bpntRate = totalPenerimaBPNT > 0 ? (totalBPNTDaftar / totalPenerimaBPNT) * 100 : 0;

    const chartDataArray = Object.entries(kapanewonMap).map(([name, vals]) => {
      const coverage = vals.desil_1_5 > 0 ? (vals.kk_daftar / vals.desil_1_5) * 100 : 0;
      const inaktif = vals.agen - vals.agen_aktif;
      return {
        kapanewon: name,
        jumlah_keluarga: vals.jumlah_keluarga,
        targetRentan: vals.desil_1_5,
        desil_1_5: vals.desil_1_5,
        kk_daftar: vals.kk_daftar,
        coverage: Number.isFinite(coverage) ? coverage : 0,
        agen: vals.agen,
        agenAktif: vals.agen_aktif,
        agenInaktif: inaktif > 0 ? inaktif : 0,
        penerima_pkh: vals.penerima_pkh,
        pkh_daftar: vals.pkh_daftar,
        penerima_bpnt: vals.penerima_bpnt,
        bpnt_daftar: vals.bpnt_daftar,
        kk_via_agen: vals.kk_via_agen,
        sisa_pendaftar_non_bantuan: Math.max(0, vals.kk_daftar - (vals.pkh_daftar + vals.bpnt_daftar)),
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

    // Lowest Kalurahan Top 5
    const lowestKalurahan = [...data]
      .map(row => {
        const target = Number(row.desil_1_5 || 0);
        const kkDaftar = Number(row.kk_daftar ?? row.total_pendaftar ?? 0);
        const coverageRate = target > 0 ? (kkDaftar / target) * 100 : 0;
        return {
          ...row,
          desil_1_5: target,
          kk_daftar: kkDaftar,
          coverageRate: Number.isFinite(coverageRate) ? coverageRate : 0,
        };
      })
      .sort((a, b) => a.coverageRate - b.coverageRate)
      .slice(0, 5);

    // Quadrant Matrix Data
    // X-Axis = Capaian ((kk_daftar / desil_1_5) * 100)
    // Y-Axis = Target (desil_1_5)
    const kpiQuadrantData = (() => {
      let sumTarget = 0;
      let sumCoverage = 0;
      
      const mapped = chartDataArray.map(item => {
        const target = Number.isFinite(item.desil_1_5) ? item.desil_1_5 : 0;
        const coverage = Number.isFinite(item.coverage) ? item.coverage : 0;
        sumTarget += target;
        sumCoverage += coverage;
        return {
          name: item.kapanewon,
          target: target,
          coverage: coverage,
        };
      });
      
      if (mapped.length === 0) return { data: [], avgTarget: 0, avgCoverage: 0 };

      const avgTarget = sumTarget / mapped.length;
      const avgCoverage = sumCoverage / mapped.length;
      
      const dataWithColors = mapped.map(item => {
        let color = "#cbd5e1";
        // X = coverage, Y = target
        if (item.coverage >= avgCoverage && item.target >= avgTarget) color = "#3b82f6"; // Q1: Optimal (Target Tinggi, Capaian Tinggi)
        else if (item.coverage >= avgCoverage && item.target < avgTarget) color = "#22c55e"; // Q2: Aman (Target Rendah, Capaian Tinggi)
        else if (item.coverage < avgCoverage && item.target < avgTarget) color = "#eab308"; // Q3: Peringatan (Target Rendah, Capaian Rendah)
        else if (item.coverage < avgCoverage && item.target >= avgTarget) color = "#ef4444"; // Q4: Darurat (Target Tinggi, Capaian Rendah)
        
        return { ...item, color };
      });

      return { data: dataWithColors, avgTarget, avgCoverage };
    })();

    return {
      metrics: { 
        totalKeluarga, 
        totalRentan, 
        totalKKDaftar, 
        coverageRate, 
        populasiRate, 
        totalAgen, 
        totalAgenAktif, 
        agenAktifRate, 
        totalKKViaAgen, 
        agenKinerjaRate, 
        totalPKHDaftar, 
        totalPenerimaPKH, 
        pkhRate,
        pkhRealisasiRate: pkhRate, 
        totalBPNTDaftar, 
        totalPenerimaBPNT, 
        bpntRate,
        bpntRealisasiRate: bpntRate, 
      },
      chartData: chartDataArray,
      lowestCoverage: lowestCoverageArray,
      mostInactiveAgents: mostInactiveAgentsArray,
      lowestKalurahan: lowestKalurahan,
      kpiQuadrantData: kpiQuadrantData,
    };
  }, [data]);

  const { totalKeluarga, totalRentan, totalKKDaftar, totalPenerimaPKH, totalPenerimaBPNT, totalPKHDaftar, totalBPNTDaftar, pkhRate, bpntRate } = metrics;

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
          Visualisasi interaktif mengenai capaian target kelompok rentan (Desil 1-5), verifikasi program sosial (PKH & BPNT), dan kesiapan agen perlinsos digital.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Section 1: Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 xl:gap-5">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah Keluarga</h3>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalKeluarga.toLocaleString('id-ID')}</span>
                <p className="text-[11px] text-gray-400 mt-1">Total Populasi Dasar (DTSEN)</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desil 1 - 5</h3>
                <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalRentan.toLocaleString('id-ID')}</span>
                <p className="text-[11px] text-gray-400 mt-1">Target Prioritas Rentan</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total KK Daftar</h3>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalKKDaftar.toLocaleString('id-ID')}</span>
                <p className="text-[11px] text-gray-400 mt-1">Capaian Pendaftaran KK</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cakupan Rentan</h3>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.coverageRate.toFixed(1)}%</span>
                <p className="text-[11px] text-gray-400 mt-1">KK Daftar / Desil 1-5</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kuota Penerima & Usulan</h3>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <HeartHandshake className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{(metrics.totalPenerimaPKH + metrics.totalPenerimaBPNT).toLocaleString('id-ID')}</span>
                <p className="text-[11px] text-gray-500 mt-1">Kuota Aktif (PKH: {metrics.totalPenerimaPKH.toLocaleString('id-ID')} | BPNT: {metrics.totalPenerimaBPNT.toLocaleString('id-ID')})</p>
                <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Total Usulan Baru: {(metrics.totalPKHDaftar + metrics.totalBPNTDaftar).toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Agen Aktif</h3>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalAgenAktif.toLocaleString('id-ID')} <span className="text-sm font-normal text-gray-400">/ {metrics.totalAgen.toLocaleString('id-ID')}</span></span>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">{metrics.agenAktifRate.toFixed(1)}% Kesiapan Agen</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">KK via Agen</h3>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{metrics.totalKKViaAgen.toLocaleString('id-ID')}</span>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">{metrics.agenKinerjaRate.toFixed(1)}% Kontribusi Pendaftar</p>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Progress Bars & Composed Charts */}
          <div className="grid grid-cols-1 gap-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Indikator Capaian Global Kabupaten</h3>
                <p className="text-sm text-gray-500">Evaluasi menyeluruh capaian pendaftaran KK, realisasi bantuan sosial programatik, dan penetrasi agen.</p>
              </div>
              <div className="flex flex-col space-y-6 mt-4">
                
                {/* 1. KK Daftar vs Populasi */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-semibold text-gray-700">KK Daftar vs Populasi (Jumlah Keluarga)</span>
                    <span className="text-gray-500 font-medium tabular-nums">
                      {totalKKDaftar.toLocaleString('id-ID')} / {totalKeluarga.toLocaleString('id-ID')}
                      <span className="text-gray-900 font-bold ml-1">({metrics.populasiRate.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.populasiRate, 100)}%` }}></div>
                  </div>
                </div>

                {/* 2. KK Daftar vs Target Rentan */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-semibold text-gray-700">KK Daftar vs Target Prioritas (Desil 1-5)</span>
                    <span className="text-gray-500 font-medium tabular-nums">
                      {totalKKDaftar.toLocaleString('id-ID')} / {totalRentan.toLocaleString('id-ID')}
                      <span className="text-gray-900 font-bold ml-1">({metrics.coverageRate.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.coverageRate, 100)}%` }}></div>
                  </div>
                </div>

                {/* 3. Usulan Penerima PKH */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-semibold text-gray-700">Persentase Usulan PKH (PKH Daftar vs Kuota Penerima)</span>
                    <span className="text-gray-500 font-medium tabular-nums">
                      {totalPKHDaftar.toLocaleString('id-ID')} / {totalPenerimaPKH.toLocaleString('id-ID')}
                      <span className="text-gray-900 font-bold ml-1">({pkhRate.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pkhRate, 100)}%` }}></div>
                  </div>
                </div>

                {/* 4. Usulan Penerima BPNT */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-semibold text-gray-700">Persentase Usulan BPNT (BPNT Daftar vs Kuota Penerima)</span>
                    <span className="text-gray-500 font-medium tabular-nums">
                      {totalBPNTDaftar.toLocaleString('id-ID')} / {totalPenerimaBPNT.toLocaleString('id-ID')}
                      <span className="text-gray-900 font-bold ml-1">({bpntRate.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(bpntRate, 100)}%` }}></div>
                  </div>
                </div>

                {/* 5. Kinerja Pendaftaran via Agen */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-semibold text-gray-700">Kontribusi Pendaftaran via Agen (KK via Agen / KK Daftar)</span>
                    <span className="text-gray-500 font-medium tabular-nums">
                      {metrics.totalKKViaAgen.toLocaleString('id-ID')} / {totalKKDaftar.toLocaleString('id-ID')}
                      <span className="text-gray-900 font-bold ml-1">({metrics.agenKinerjaRate.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.agenKinerjaRate, 100)}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Analisis Capaian Pendaftar vs Target & Realisasi</h3>
                <p className="text-sm text-gray-500">Evaluasi komprehensif KK Daftar dibandingkan dengan Total Keluarga (Populasi), Target Desil 1-5, dan Realisasi Penerima Bantuan per kapanewon.</p>
              </div>
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="kapanewon" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value: any) => value ? Number(value).toLocaleString('id-ID') : '0'} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="jumlah_keluarga" name="Total Keluarga (Populasi)" fill="#f1f5f9" stroke="#cbd5e1" />
                    <Bar dataKey="pkh_daftar" name="Usulan PKH" stackId="pendaftar" fill="#fb7185" maxBarSize={40} />
                    <Bar dataKey="bpnt_daftar" name="Usulan BPNT" stackId="pendaftar" fill="#fbbf24" maxBarSize={40} />
                    <Bar dataKey="sisa_pendaftar_non_bantuan" name="Pendaftar Non-Bantuan" stackId="pendaftar" fill="#94a3b8" maxBarSize={40} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="desil_1_5" name="Target Desil 1 - 5" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kesiapan Agen: Total vs Aktif</h3>
                <p className="text-sm text-gray-500">Perbandingan jumlah total agen terdaftar dengan jumlah agen yang saat ini aktif beroperasi di tiap kapanewon.</p>
              </div>
              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="kapanewon" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value: any) => value ? Number(value).toLocaleString('id-ID') : '0'} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="agen" name="Total Agen" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="agenAktif" name="Agen Aktif" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Quadrant: X = Capaian ((kk_daftar / desil_1_5) * 100), Y = Target (desil_1_5) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Matriks Kuadran Performa Kapanewon</h3>
                <p className="text-sm text-gray-500">
                  Analisis sebaran performa berdasarkan <strong>Sumbu X: Tingkat Capaian (KK Daftar / Desil 1-5 %)</strong> dan <strong>Sumbu Y: Volume Target (Desil 1-5)</strong>. Kuadran merah menunjukkan prioritas darurat (target tinggi dengan capaian rendah).
                </p>
              </div>
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" dataKey="coverage" name="Capaian" tick={{ fontSize: 11, fill: '#6b7280' }} unit="%" />
                    <YAxis type="number" dataKey="target" name="Target (Desil 1-5)" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <ZAxis type="category" dataKey="name" name="Kapanewon" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          const cov = Number.isFinite(pt.coverage) ? pt.coverage : 0;
                          const tgt = Number.isFinite(pt.target) ? pt.target : 0;
                          return (
                            <div className="bg-white p-3 border border-slate-200 rounded-md shadow-md text-sm z-50 relative">
                              <p className="font-bold text-slate-800 mb-2 border-b pb-1">{pt.name || 'Unknown'}</p>
                              <p className="text-slate-600 mb-1">
                                <span className="font-semibold">Capaian (X):</span> {cov.toFixed(1)}%
                              </p>
                              <p className="text-slate-600">
                                <span className="font-semibold">Target Desil 1-5 (Y):</span> {tgt.toLocaleString('id-ID')}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine x={kpiQuadrantData.avgCoverage} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Rata-rata Capaian', fill: '#64748b', fontSize: 10 }} />
                    <ReferenceLine y={kpiQuadrantData.avgTarget} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'right', value: 'Rata-rata Target', fill: '#64748b', fontSize: 10 }} />
                    <Scatter name="Kapanewon" data={kpiQuadrantData.data}>
                      {kpiQuadrantData.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-gray-600">Optimal (Target Tinggi, Capaian Tinggi)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-xs text-gray-600">Aman (Target Rendah, Capaian Tinggi)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-xs text-gray-600">Peringatan (Target Rendah, Capaian Rendah)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs text-gray-600">Darurat (Target Tinggi, Capaian Rendah)</span></div>
              </div>
            </div>
          </div>

          {/* Section 3: Actionable Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table 1: Top 5 Cakupan Terendah */}
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
                      <th className="px-5 py-3 font-semibold text-right">KK Daftar</th>
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
                            <td className="px-5 py-3 text-right tabular-nums">{item.kk_daftar.toLocaleString('id-ID')}</td>
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

            {/* Table 2: Top 5 Agen Inaktif */}
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

            {/* Table 3: Top 5 Kalurahan Intervensi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-rose-50/30">
                <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Top 5 Kalurahan Perlu Intervensi
                </h3>
                <p className="text-xs text-gray-500 mt-1">Capaian KK Daftar vs Desil 1-5 Terendah</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Kalurahan</th>
                      <th className="px-5 py-3 font-semibold">Kapanewon</th>
                      <th className="px-5 py-3 font-semibold text-right">Target</th>
                      <th className="px-5 py-3 font-semibold text-right">KK Daftar</th>
                      <th className="px-5 py-3 font-semibold text-right">% Capaian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lowestKalurahan.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-6 text-center text-gray-500">Tidak ada data</td>
                      </tr>
                    ) : (
                      lowestKalurahan.map((item, index) => {
                        return (
                          <tr key={`${item.kapanewon}-${item.kalurahan}`} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold text-[10px]">
                                {index + 1}
                              </span>
                              {item.kalurahan}
                            </td>
                            <td className="px-5 py-3 text-gray-500">{item.kapanewon}</td>
                            <td className="px-5 py-3 text-right tabular-nums">{Number(item.desil_1_5 || 0).toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-right tabular-nums">{Number(item.kk_daftar || 0).toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-right font-bold tabular-nums">
                              <span className={`text-rose-600 font-bold`}>
                                {item.coverageRate.toFixed(1)}%
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
