'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { useSupabaseView } from '@/lib/hooks/useSupabaseView';
import { 
  Users, 
  Target, 
  FileText, 
  PieChart, 
  HeartHandshake, 
  Activity, 
  Store, 
  Search, 
  ChevronDown, 
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  TrendingDown, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  ComposedChart, 
  Area, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface PerlinsosData {
  id?: number | string;
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
  /** Total agents as exposed by view_perlinsos_dtsen. */
  total_agen?: number;
  /** Legacy name from older view versions. */
  agen?: number;
  agen_aktif: number;
  kk_via_agen?: number;
  periode_dtsen?: string;
  tahun?: string | number;
}

/** Safely parses any value (number, string with commas/spaces, null/undefined) to a valid number. */
function toSafeNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').trim();
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

type FilterMode = 
  | 'all' 
  | 'sort_capaian_desil_tertinggi'
  | 'sort_capaian_desil_terendah'
  | 'sort_realisasi_bpnt_tertinggi'
  | 'sort_realisasi_bpnt_terendah'
  | 'sort_realisasi_pkh_tertinggi'
  | 'sort_realisasi_pkh_terendah'
  | 'lowest-kk-populasi' 
  | 'lowest-kk-rentan' 
  | 'lowest-pkh' 
  | 'lowest-bpnt' 
  | 'lowest-agen';

export default function PublicPerlinsosClient() {
  // Fetches on mount, on tab focus, on cross-tab notify, and on Realtime changes.
  const { data, loading, error } = useSupabaseView<PerlinsosData>('view_perlinsos_dtsen', {
    orderBy: [{ column: 'kapanewon' }, { column: 'kalurahan' }],
    realtimeTables: ['rekap_pendaftaran_perlinsos'],
  });

  // Search & Filter state
  const [searchKapanewon, setSearchKapanewon] = useState('');
  const [searchKalurahan, setSearchKalurahan] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Collapsible Kapanewon groups tracking
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hasInitializedExpanded, setHasInitializedExpanded] = useState(false);

  // Initialize all Kapanewons as expanded on first data load
  useEffect(() => {
    if (data.length > 0 && !hasInitializedExpanded) {
      const all = new Set(data.map((d) => d.kapanewon).filter(Boolean));
      setExpandedGroups(all);
      setHasInitializedExpanded(true);
    }
  }, [data, hasInitializedExpanded]);

  const toggleGroup = (kapanewon: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(kapanewon)) {
        next.delete(kapanewon);
      } else {
        next.add(kapanewon);
      }
      return next;
    });
  };

  const isGroupExpanded = (kapanewon: string) => {
    // When search is active, automatically expand groups so matching rows are visible
    if (searchKapanewon.trim() || searchKalurahan.trim()) return true;
    return expandedGroups.has(kapanewon);
  };

  const handleExpandAll = () => {
    const all = new Set(data.map((d) => d.kapanewon).filter(Boolean));
    setExpandedGroups(all);
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
  };

  // 1. KPI Metrics Calculation
  const { metrics, chartData } = useMemo(() => {
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
      const agen = Number(row.total_agen ?? row.agen ?? 0);
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
      return {
        kapanewon: name,
        jumlah_keluarga: vals.jumlah_keluarga,
        targetRentan: vals.desil_1_5,
        desil_1_5: vals.desil_1_5,
        kk_daftar: vals.kk_daftar,
        coverage: Number.isFinite(coverage) ? coverage : 0,
        agen: vals.agen,
        agenAktif: vals.agen_aktif,
        penerima_pkh: vals.penerima_pkh,
        pkh_daftar: vals.pkh_daftar,
        penerima_bpnt: vals.penerima_bpnt,
        bpnt_daftar: vals.bpnt_daftar,
        kk_via_agen: vals.kk_via_agen,
        sisa_pendaftar_non_bantuan: Math.max(0, vals.kk_daftar - (vals.pkh_daftar + vals.bpnt_daftar)),
      };
    });

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
        totalBPNTDaftar,
        totalPenerimaBPNT,
        bpntRate,
      },
      chartData: chartDataArray,
    };
  }, [data]);

  // 2. Table Data Processing: Text Search + Sorting
  const processedTableData = useMemo(() => {
    if (!data) return [];

    // Filter Step (Case-Insensitive)
    const filtered = data.filter((item) => {
      const matchKapanewon = item.kapanewon?.toLowerCase().includes(searchKapanewon.toLowerCase()) ?? true;
      const matchKalurahan = item.kalurahan?.toLowerCase().includes(searchKalurahan.toLowerCase()) ?? true;
      return matchKapanewon && matchKalurahan;
    });

    // Metric Calculations Step
    const processed = filtered.map((row) => {
      const jumlahKeluarga = Number(toSafeNumber(row.jumlah_keluarga)) || 0;
      const desil15 = Number(toSafeNumber(row.desil_1_5)) || 0;
      const kkDaftar = Number(toSafeNumber(row.kk_daftar ?? row.total_pendaftar)) || 0;
      const bpntDaftar = Number(toSafeNumber(row.bpnt_daftar)) || 0;
      const penerimaBpnt = Number(toSafeNumber(row.penerima_bpnt)) || 0;
      const pkhDaftar = Number(toSafeNumber(row.pkh_daftar)) || 0;
      const penerimaPkh = Number(toSafeNumber(row.penerima_pkh)) || 0;
      const agen = Number(toSafeNumber(row.total_agen ?? row.agen)) || 0;
      const agenAktif = Number(toSafeNumber(row.agen_aktif)) || 0;
      const kkViaAgen = Number(toSafeNumber(row.kk_via_agen)) || 0;

      const kkPopulasiRate = jumlahKeluarga > 0 ? (kkDaftar / jumlahKeluarga) * 100 : 0;
      const kkRentanRate = desil15 > 0 ? (kkDaftar / desil15) * 100 : 0;
      const pkhRealisasiRate = penerimaPkh > 0 ? (pkhDaftar / penerimaPkh) * 100 : 0;
      const bpntRealisasiRate = penerimaBpnt > 0 ? (bpntDaftar / penerimaBpnt) * 100 : 0;
      const agenKinerjaRate = kkDaftar > 0 ? (kkViaAgen / kkDaftar) * 100 : 0;

      return {
        ...row,
        jumlah_keluarga: jumlahKeluarga,
        desil_1_5: desil15,
        kk_daftar: kkDaftar,
        bpnt_daftar: bpntDaftar,
        penerima_bpnt: penerimaBpnt,
        pkh_daftar: pkhDaftar,
        penerima_pkh: penerimaPkh,
        agen,
        agen_aktif: agenAktif,
        kk_via_agen: kkViaAgen,
        kkPopulasiRate,
        kkRentanRate,
        pkhRealisasiRate,
        bpntRealisasiRate,
        agenKinerjaRate,
      };
    });

    // Sorting Step
    switch (filterMode) {
      case 'sort_capaian_desil_tertinggi':
        processed.sort((a, b) => {
          const rateA = a.desil_1_5 > 0 ? (a.kk_daftar / a.desil_1_5) : 0;
          const rateB = b.desil_1_5 > 0 ? (b.kk_daftar / b.desil_1_5) : 0;
          return rateB - rateA;
        });
        break;

      case 'sort_capaian_desil_terendah':
        processed.sort((a, b) => {
          const rateA = a.desil_1_5 > 0 ? (a.kk_daftar / a.desil_1_5) : 0;
          const rateB = b.desil_1_5 > 0 ? (b.kk_daftar / b.desil_1_5) : 0;
          return rateA - rateB;
        });
        break;

      case 'sort_realisasi_bpnt_tertinggi':
        processed.sort((a, b) => {
          const rateA = a.penerima_bpnt > 0 ? (a.bpnt_daftar / a.penerima_bpnt) : 0;
          const rateB = b.penerima_bpnt > 0 ? (b.bpnt_daftar / b.penerima_bpnt) : 0;
          return rateB - rateA;
        });
        break;

      case 'sort_realisasi_bpnt_terendah':
        processed.sort((a, b) => {
          const rateA = a.penerima_bpnt > 0 ? (a.bpnt_daftar / a.penerima_bpnt) : 0;
          const rateB = b.penerima_bpnt > 0 ? (b.bpnt_daftar / b.penerima_bpnt) : 0;
          return rateA - rateB;
        });
        break;

      case 'sort_realisasi_pkh_tertinggi':
        processed.sort((a, b) => {
          const rateA = a.penerima_pkh > 0 ? (a.pkh_daftar / a.penerima_pkh) : 0;
          const rateB = b.penerima_pkh > 0 ? (b.pkh_daftar / b.penerima_pkh) : 0;
          return rateB - rateA;
        });
        break;

      case 'sort_realisasi_pkh_terendah':
        processed.sort((a, b) => {
          const rateA = a.penerima_pkh > 0 ? (a.pkh_daftar / a.penerima_pkh) : 0;
          const rateB = b.penerima_pkh > 0 ? (b.pkh_daftar / b.penerima_pkh) : 0;
          return rateA - rateB;
        });
        break;

      case 'lowest-kk-populasi':
        return [...processed].sort((a, b) => a.kkPopulasiRate - b.kkPopulasiRate);
      case 'lowest-kk-rentan':
        return [...processed].sort((a, b) => a.kkRentanRate - b.kkRentanRate);
      case 'lowest-pkh':
        return [...processed].sort((a, b) => a.pkhRealisasiRate - b.pkhRealisasiRate);
      case 'lowest-bpnt':
        return [...processed].sort((a, b) => a.bpntRealisasiRate - b.bpntRealisasiRate);
      case 'lowest-agen':
        return [...processed].sort((a, b) => a.agenKinerjaRate - b.agenKinerjaRate);
      default:
        return processed;
    }

    return processed;
  }, [data, filterMode, searchKapanewon, searchKalurahan]);

  // Group filtered data by Kapanewon and compute subtotal aggregations
  const groupedData = useMemo(() => {
    if (!processedTableData || processedTableData.length === 0) return [];

    const map = new Map<string, {
      kapanewon: string;
      subtotals: {
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
        kkPopulasiRate: number;
        kkRentanRate: number;
        pkhRealisasiRate: number;
        bpntRealisasiRate: number;
        agenKinerjaRate: number;
      };
      rows: typeof processedTableData;
    }>();

    processedTableData.forEach((row) => {
      const kap = row.kapanewon || '-';
      if (!map.has(kap)) {
        map.set(kap, {
          kapanewon: kap,
          subtotals: {
            jumlah_keluarga: 0,
            desil_1_5: 0,
            kk_daftar: 0,
            bpnt_daftar: 0,
            penerima_bpnt: 0,
            pkh_daftar: 0,
            penerima_pkh: 0,
            agen: 0,
            agen_aktif: 0,
            kk_via_agen: 0,
            kkPopulasiRate: 0,
            kkRentanRate: 0,
            pkhRealisasiRate: 0,
            bpntRealisasiRate: 0,
            agenKinerjaRate: 0,
          },
          rows: [],
        });
      }

      const group = map.get(kap)!;
      group.rows.push(row);
      group.subtotals.jumlah_keluarga += Number(toSafeNumber(row.jumlah_keluarga)) || 0;
      group.subtotals.desil_1_5 += Number(toSafeNumber(row.desil_1_5)) || 0;
      group.subtotals.kk_daftar += Number(toSafeNumber(row.kk_daftar ?? (row as any).total_pendaftar)) || 0;
      group.subtotals.bpnt_daftar += Number(toSafeNumber(row.bpnt_daftar)) || 0;
      group.subtotals.penerima_bpnt += Number(toSafeNumber(row.penerima_bpnt)) || 0;
      group.subtotals.pkh_daftar += Number(toSafeNumber(row.pkh_daftar)) || 0;
      group.subtotals.penerima_pkh += Number(toSafeNumber(row.penerima_pkh)) || 0;
      group.subtotals.agen += Number(toSafeNumber(row.agen ?? (row as any).total_agen)) || 0;
      group.subtotals.agen_aktif += Number(toSafeNumber(row.agen_aktif)) || 0;
      group.subtotals.kk_via_agen += Number(toSafeNumber(row.kk_via_agen)) || 0;
    });

    const groups = Array.from(map.values()).map((g) => {
      const sub = g.subtotals;
      sub.kkPopulasiRate = sub.jumlah_keluarga > 0 ? (sub.kk_daftar / sub.jumlah_keluarga) * 100 : 0;
      sub.kkRentanRate = sub.desil_1_5 > 0 ? (sub.kk_daftar / sub.desil_1_5) * 100 : 0;
      sub.pkhRealisasiRate = sub.penerima_pkh > 0 ? (sub.pkh_daftar / sub.penerima_pkh) * 100 : 0;
      sub.bpntRealisasiRate = sub.penerima_bpnt > 0 ? (sub.bpnt_daftar / sub.penerima_bpnt) * 100 : 0;
      sub.agenKinerjaRate = sub.kk_daftar > 0 ? (sub.kk_via_agen / sub.kk_daftar) * 100 : 0;
      return g;
    });

    // Sort Kapanewon groups according to the selected filter mode
    switch (filterMode) {
      case 'sort_capaian_desil_tertinggi':
        groups.sort((a, b) => b.subtotals.kkRentanRate - a.subtotals.kkRentanRate);
        break;
      case 'sort_capaian_desil_terendah':
        groups.sort((a, b) => a.subtotals.kkRentanRate - b.subtotals.kkRentanRate);
        break;
      case 'sort_realisasi_bpnt_tertinggi':
        groups.sort((a, b) => b.subtotals.bpntRealisasiRate - a.subtotals.bpntRealisasiRate);
        break;
      case 'sort_realisasi_bpnt_terendah':
        groups.sort((a, b) => a.subtotals.bpntRealisasiRate - b.subtotals.bpntRealisasiRate);
        break;
      case 'sort_realisasi_pkh_tertinggi':
        groups.sort((a, b) => b.subtotals.pkhRealisasiRate - a.subtotals.pkhRealisasiRate);
        break;
      case 'sort_realisasi_pkh_terendah':
        groups.sort((a, b) => a.subtotals.pkhRealisasiRate - b.subtotals.pkhRealisasiRate);
        break;
      case 'lowest-kk-populasi':
        groups.sort((a, b) => a.subtotals.kkPopulasiRate - b.subtotals.kkPopulasiRate);
        break;
      case 'lowest-kk-rentan':
        groups.sort((a, b) => a.subtotals.kkRentanRate - b.subtotals.kkRentanRate);
        break;
      case 'lowest-pkh':
        groups.sort((a, b) => a.subtotals.pkhRealisasiRate - b.subtotals.pkhRealisasiRate);
        break;
      case 'lowest-bpnt':
        groups.sort((a, b) => a.subtotals.bpntRealisasiRate - b.subtotals.bpntRealisasiRate);
        break;
      case 'lowest-agen':
        groups.sort((a, b) => a.subtotals.agenKinerjaRate - b.subtotals.agenKinerjaRate);
        break;
      default:
        break;
    }

    return groups;
  }, [data, processedTableData, filterMode]);

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-3 border border-red-200 shadow-sm">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">Gagal Memuat Portal Publik</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner / Public Identity Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              SD
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Satu Data Sosial & P3A • Pemkab Gunungkidul
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Portal Informasi Terbuka</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 pt-8 space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              Publik & Eksternal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Portal Publik Perlinsos Digital
            </h1>
            <p className="text-sm md:text-base text-gray-500 max-w-3xl">
              Pantauan real-time capaian pendaftaran perlindungan sosial kelompok rentan (Desil 1-5), usulan verifikasi program bantuan sosial (PKH & BPNT), dan kesiapan agen.
            </p>
          </div>
        </div>

        {loading && data.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-72 space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 font-medium">Memuat data capaian perlinsos...</p>
          </div>
        ) : (
          <>
            {/* Section 1: KPI Summary Cards (Data Funnel) */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {/* Card 1: Jumlah Keluarga */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah Keluarga</h3>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {metrics.totalKeluarga.toLocaleString('id-ID')}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">Total Populasi Dasar (DTSEN)</p>
                </div>
              </div>

              {/* Card 2: Desil 1 - 5 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desil 1 - 5</h3>
                  <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {metrics.totalRentan.toLocaleString('id-ID')}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">Target Prioritas Rentan</p>
                </div>
              </div>

              {/* Card 3: Total KK Daftar */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total KK Daftar</h3>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {metrics.totalKKDaftar.toLocaleString('id-ID')}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">Capaian Pendaftaran KK</p>
                </div>
              </div>

              {/* Card 4: Cakupan Rentan */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cakupan Rentan</h3>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <PieChart className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {metrics.coverageRate.toFixed(1)}%
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">KK Daftar / Desil 1-5</p>
                </div>
              </div>

              {/* Card 5: Kuota Penerima & Usulan */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kuota & Usulan</h3>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {(metrics.totalPenerimaPKH + metrics.totalPenerimaBPNT).toLocaleString('id-ID')}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Kuota Aktif (PKH & BPNT)
                  </p>
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                    Usulan Baru: {(metrics.totalPKHDaftar + metrics.totalBPNTDaftar).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Card 6: Agen Aktif */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Agen Aktif</h3>
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {metrics.totalAgenAktif.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-normal text-gray-400">/ {metrics.totalAgen.toLocaleString('id-ID')}</span>
                  </span>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {metrics.agenAktifRate.toFixed(1)}% Kesiapan Agen
                  </p>
                </div>
              </div>

              {/* Card 7: KK via Agen */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">KK via Agen</h3>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {metrics.totalKKViaAgen.toLocaleString('id-ID')}
                  </span>
                  <p className="text-[11px] text-blue-600 font-semibold mt-1">
                    {metrics.agenKinerjaRate.toFixed(1)}% Kontribusi Pendaftar
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Progress Bars & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Progress Bars */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Indikator Capaian Utama</h3>
                  <p className="text-sm text-gray-500">Evaluasi menyeluruh capaian target daerah dan program bansos.</p>
                </div>

                <div className="flex flex-col space-y-5">
                  {/* 1. KK Daftar vs Populasi */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-semibold text-gray-700">KK Daftar vs Populasi</span>
                      <span className="text-gray-500 font-medium tabular-nums text-xs">
                        {metrics.totalKKDaftar.toLocaleString('id-ID')} / {metrics.totalKeluarga.toLocaleString('id-ID')}
                        <span className="text-gray-900 font-bold ml-1">({metrics.populasiRate.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.populasiRate, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* 2. KK Daftar vs Desil 1-5 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-semibold text-gray-700">KK Daftar vs Desil 1-5</span>
                      <span className="text-gray-500 font-medium tabular-nums text-xs">
                        {metrics.totalKKDaftar.toLocaleString('id-ID')} / {metrics.totalRentan.toLocaleString('id-ID')}
                        <span className="text-gray-900 font-bold ml-1">({metrics.coverageRate.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.coverageRate, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* 3. Usulan PKH */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-semibold text-gray-700">Usulan PKH vs Kuota Penerima</span>
                      <span className="text-gray-500 font-medium tabular-nums text-xs">
                        {metrics.totalPKHDaftar.toLocaleString('id-ID')} / {metrics.totalPenerimaPKH.toLocaleString('id-ID')}
                        <span className="text-gray-900 font-bold ml-1">({metrics.pkhRate.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.pkhRate, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* 4. Usulan BPNT */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-semibold text-gray-700">Usulan BPNT vs Kuota Penerima</span>
                      <span className="text-gray-500 font-medium tabular-nums text-xs">
                        {metrics.totalBPNTDaftar.toLocaleString('id-ID')} / {metrics.totalPenerimaBPNT.toLocaleString('id-ID')}
                        <span className="text-gray-900 font-bold ml-1">({metrics.bpntRate.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.bpntRate, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* 5. Agen Kinerja */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-semibold text-gray-700">Kontribusi Pendaftaran via Agen</span>
                      <span className="text-gray-500 font-medium tabular-nums text-xs">
                        {metrics.totalKKViaAgen.toLocaleString('id-ID')} / {metrics.totalKKDaftar.toLocaleString('id-ID')}
                        <span className="text-gray-900 font-bold ml-1">({metrics.agenKinerjaRate.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(metrics.agenKinerjaRate, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Komparasi Capaian Pendaftar vs Target per Kapanewon</h3>
                  <p className="text-sm text-gray-500">Breakdown pendaftaran KK (usulan PKH, BPNT, pendaftar umum) dibandingkan garis target Desil 1-5.</p>
                </div>
                <div className="h-[340px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="kapanewon" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip 
                        cursor={{ fill: '#f3f4f6' }} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                        formatter={(value: any) => value ? Number(value).toLocaleString('id-ID') : '0'} 
                      />
                      <Legend wrapperStyle={{ paddingTop: '8px' }} />
                      <Area type="monotone" dataKey="jumlah_keluarga" name="Total Keluarga" fill="#f8fafc" stroke="#e2e8f0" />
                      <Bar dataKey="pkh_daftar" name="Usulan PKH" stackId="pendaftar" fill="#fb7185" maxBarSize={32} />
                      <Bar dataKey="bpnt_daftar" name="Usulan BPNT" stackId="pendaftar" fill="#fbbf24" maxBarSize={32} />
                      <Bar dataKey="sisa_pendaftar_non_bantuan" name="Pendaftar Non-Bantuan" stackId="pendaftar" fill="#94a3b8" maxBarSize={32} radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="desil_1_5" name="Target Desil 1 - 5" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Section 3: The Public Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 md:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">Rincian Data per Kalurahan</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tabel rekapitulasi capaian pendaftaran, perbandingan target rentan, dan kinerja agen se-Kabupaten Gunungkidul.
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative w-full sm:w-48">
                    <input
                      type="text"
                      placeholder="Cari Kapanewon..."
                      value={searchKapanewon}
                      onChange={(e) => setSearchKapanewon(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative w-full sm:w-48">
                    <input
                      type="text"
                      placeholder="Cari Kalurahan..."
                      value={searchKalurahan}
                      onChange={(e) => setSearchKalurahan(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={handleExpandAll}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Buka semua grup Kapanewon"
                      >
                        <ChevronsDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>Buka Semua</span>
                      </button>
                      <div className="w-[1px] h-3.5 bg-slate-200" />
                      <button
                        type="button"
                        onClick={handleCollapseAll}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Tutup semua grup Kapanewon"
                      >
                        <ChevronsUp className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tutup Semua</span>
                      </button>
                    </div>

                    <div className="relative w-full sm:w-auto">
                      <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                        className={`w-full sm:w-auto appearance-none pl-8 pr-7 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm outline-none cursor-pointer ${filterMode !== 'all' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
                      >
                        <option value="all">Semua Data</option>
                        <option value="sort_capaian_desil_tertinggi">Capaian Target Tertinggi (KK Daftar vs Desil 1-5)</option>
                        <option value="sort_capaian_desil_terendah">Capaian Target Terendah (KK Daftar vs Desil 1-5)</option>
                        <option value="sort_realisasi_bpnt_tertinggi">Usulan BPNT Tertinggi (Daftar vs Penerima)</option>
                        <option value="sort_realisasi_bpnt_terendah">Usulan BPNT Terendah (Daftar vs Penerima)</option>
                        <option value="sort_realisasi_pkh_tertinggi">Usulan PKH Tertinggi (Daftar vs Penerima)</option>
                        <option value="sort_realisasi_pkh_terendah">Usulan PKH Terendah (Daftar vs Penerima)</option>
                        <option value="lowest-kk-populasi">Sorot KK Daftar vs Jumlah Keluarga Terendah</option>
                        <option value="lowest-kk-rentan">Sorot KK Daftar vs Desil 1-5 Terendah</option>
                        <option value="lowest-pkh">Sorot Realisasi PKH Terendah</option>
                        <option value="lowest-bpnt">Sorot Realisasi BPNT Terendah</option>
                        <option value="lowest-agen">Sorot Kinerja Agen Terendah</option>
                      </select>
                      <TrendingDown className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${filterMode !== 'all' ? 'text-orange-600' : 'text-slate-500'}`}/>
                      <ChevronDown className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${filterMode !== 'all' ? 'text-orange-600' : 'text-slate-500'}`}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Wrapper (Strictly Read-Only - NO AKSI column) */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[11px] text-gray-700 bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase">Kapanewon</th>
                      <th className="px-4 py-3 font-semibold uppercase">Kalurahan</th>
                      <th className="px-4 py-3 font-semibold text-right">Jumlah Keluarga</th>
                      <th className="px-4 py-3 font-semibold text-right">Desil 1-5</th>
                      <th className="px-4 py-3 font-semibold text-right">KK Daftar</th>
                      <th className="px-4 py-3 font-semibold text-right">BPNT Daftar</th>
                      <th className="px-4 py-3 font-semibold text-right">Penerima BPNT</th>
                      <th className="px-4 py-3 font-semibold text-right">PKH Daftar</th>
                      <th className="px-4 py-3 font-semibold text-right">Penerima PKH</th>
                      <th className="px-4 py-3 font-semibold text-right">Agen</th>
                      <th className="px-4 py-3 font-semibold text-right">Agen Aktif</th>
                      <th className="px-4 py-3 font-semibold text-right">KK via Agen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupedData.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                          {searchKapanewon || searchKalurahan ? 'Tidak ada data yang cocok dengan kriteria pencarian' : 'Tidak ada data ditemukan'}
                        </td>
                      </tr>
                    ) : (
                      groupedData.map((group) => {
                        const isExpanded = isGroupExpanded(group.kapanewon);
                        const sub = group.subtotals;

                        let groupActiveRate = 0;
                        let isGroupLowCoverage = false;

                        if (filterMode === 'sort_capaian_desil_tertinggi' || filterMode === 'sort_capaian_desil_terendah') {
                          groupActiveRate = sub.kkRentanRate;
                          isGroupLowCoverage = filterMode === 'sort_capaian_desil_terendah' && groupActiveRate < 30;
                        } else if (filterMode === 'sort_realisasi_bpnt_tertinggi' || filterMode === 'sort_realisasi_bpnt_terendah') {
                          groupActiveRate = sub.bpntRealisasiRate;
                          isGroupLowCoverage = filterMode === 'sort_realisasi_bpnt_terendah' && groupActiveRate < 20;
                        } else if (filterMode === 'sort_realisasi_pkh_tertinggi' || filterMode === 'sort_realisasi_pkh_terendah') {
                          groupActiveRate = sub.pkhRealisasiRate;
                          isGroupLowCoverage = filterMode === 'sort_realisasi_pkh_terendah' && groupActiveRate < 20;
                        } else if (filterMode === 'lowest-kk-populasi') {
                          groupActiveRate = sub.kkPopulasiRate;
                          isGroupLowCoverage = groupActiveRate < 30;
                        } else if (filterMode === 'lowest-kk-rentan') {
                          groupActiveRate = sub.kkRentanRate;
                          isGroupLowCoverage = groupActiveRate < 30;
                        } else if (filterMode === 'lowest-pkh') {
                          groupActiveRate = sub.pkhRealisasiRate;
                          isGroupLowCoverage = groupActiveRate < 20;
                        } else if (filterMode === 'lowest-bpnt') {
                          groupActiveRate = sub.bpntRealisasiRate;
                          isGroupLowCoverage = groupActiveRate < 20;
                        } else if (filterMode === 'lowest-agen') {
                          groupActiveRate = sub.agenKinerjaRate;
                          isGroupLowCoverage = groupActiveRate < 30;
                        }

                        return (
                          <Fragment key={`portal-group-${group.kapanewon}`}>
                            {/* Parent Row (Kapanewon Header & Subtotal) */}
                            <tr
                              onClick={() => toggleGroup(group.kapanewon)}
                              className="bg-slate-100/95 hover:bg-slate-200/80 cursor-pointer transition-colors border-y border-slate-300 font-semibold text-slate-900 select-none"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-0.5 text-slate-600">
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                                    )}
                                  </div>
                                  <span className="font-bold text-gray-900 text-xs tracking-tight">
                                    {group.kapanewon}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-300 px-1.5 py-0.5 rounded-full shadow-2xs">
                                    {group.rows.length} Kalurahan
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-500 italic font-medium">
                                Subtotal
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                                {sub.jumlah_keluarga.toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                                {sub.desil_1_5.toLocaleString('id-ID')}
                              </td>

                              {/* Subtotal KK DAFTAR */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="font-bold text-slate-900">{sub.kk_daftar.toLocaleString('id-ID')}</span>
                                  <div className="flex flex-col items-end text-[10px] text-slate-500 font-normal">
                                    <span>
                                      vs Desil: <span className="font-semibold text-slate-700">{sub.kkRentanRate.toFixed(1)}%</span>
                                    </span>
                                    <span>
                                      vs Pop: <span className="font-semibold text-slate-700">{sub.kkPopulasiRate.toFixed(1)}%</span>
                                    </span>
                                  </div>
                                  {(filterMode === 'lowest-kk-populasi' || filterMode === 'lowest-kk-rentan') && (
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                      {groupActiveRate.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Subtotal BPNT DAFTAR */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="font-bold text-slate-900">{sub.bpnt_daftar.toLocaleString('id-ID')}</span>
                                  <div className="text-[10px] text-slate-500 font-normal">
                                    <span className="font-medium text-slate-700">
                                      {sub.penerima_bpnt > 0 ? `${sub.bpntRealisasiRate.toFixed(1)}% Usulan` : '0% Usulan'}
                                    </span>
                                  </div>
                                  {(filterMode === 'lowest-bpnt' || filterMode === 'sort_realisasi_bpnt_terendah') && (
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                      {sub.bpntRealisasiRate.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Subtotal PENERIMA BPNT */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                                {sub.penerima_bpnt.toLocaleString('id-ID')}
                              </td>

                              {/* Subtotal PKH DAFTAR */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="font-bold text-slate-900">{sub.pkh_daftar.toLocaleString('id-ID')}</span>
                                  <div className="text-[10px] text-slate-500 font-normal">
                                    <span className="font-medium text-slate-700">
                                      {sub.penerima_pkh > 0 ? `${sub.pkhRealisasiRate.toFixed(1)}% Usulan` : '0% Usulan'}
                                    </span>
                                  </div>
                                  {(filterMode === 'lowest-pkh' || filterMode === 'sort_realisasi_pkh_terendah') && (
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                      {sub.pkhRealisasiRate.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Subtotal PENERIMA PKH */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                                {sub.penerima_pkh.toLocaleString('id-ID')}
                              </td>

                              {/* Subtotal AGEN */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                                {sub.agen.toLocaleString('id-ID')}
                              </td>

                              {/* Subtotal AGEN AKTIF */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                                {sub.agen_aktif.toLocaleString('id-ID')}
                              </td>

                              {/* Subtotal KK VIA AGEN */}
                              <td className="px-4 py-3 text-right tabular-nums font-bold">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-slate-900">{sub.kk_via_agen.toLocaleString('id-ID')}</span>
                                  {filterMode === 'lowest-agen' && (
                                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                      {sub.agenKinerjaRate.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Child Rows (Kalurahan Data) */}
                            {isExpanded &&
                              group.rows.map((row) => {
                                let activeRate = 0;
                                let isLowCoverage = false;

                                if (filterMode === 'sort_capaian_desil_tertinggi' || filterMode === 'sort_capaian_desil_terendah') {
                                  activeRate = row.desil_1_5 > 0 ? (row.kk_daftar / row.desil_1_5) * 100 : 0;
                                  isLowCoverage = filterMode === 'sort_capaian_desil_terendah' && activeRate < 30;
                                } else if (filterMode === 'sort_realisasi_bpnt_tertinggi' || filterMode === 'sort_realisasi_bpnt_terendah') {
                                  activeRate = row.penerima_bpnt > 0 ? (row.bpnt_daftar / row.penerima_bpnt) * 100 : 0;
                                  isLowCoverage = filterMode === 'sort_realisasi_bpnt_terendah' && activeRate < 20;
                                } else if (filterMode === 'sort_realisasi_pkh_tertinggi' || filterMode === 'sort_realisasi_pkh_terendah') {
                                  activeRate = row.penerima_pkh > 0 ? (row.pkh_daftar / row.penerima_pkh) * 100 : 0;
                                  isLowCoverage = filterMode === 'sort_realisasi_pkh_terendah' && activeRate < 20;
                                } else if (filterMode === 'lowest-kk-populasi') {
                                  activeRate = row.kkPopulasiRate;
                                  isLowCoverage = activeRate < 30;
                                } else if (filterMode === 'lowest-kk-rentan') {
                                  activeRate = row.kkRentanRate;
                                  isLowCoverage = activeRate < 30;
                                } else if (filterMode === 'lowest-pkh') {
                                  activeRate = row.pkhRealisasiRate;
                                  isLowCoverage = activeRate < 20;
                                } else if (filterMode === 'lowest-bpnt') {
                                  activeRate = row.bpntRealisasiRate;
                                  isLowCoverage = activeRate < 20;
                                } else if (filterMode === 'lowest-agen') {
                                  activeRate = row.agenKinerjaRate;
                                  isLowCoverage = activeRate < 30;
                                }

                                return (
                                  <tr 
                                    key={`${row.kapanewon}-${row.kalurahan}-${row.id ?? ''}`}
                                    className={`transition-colors ${isLowCoverage ? 'bg-red-50/70 hover:bg-red-100/70' : 'hover:bg-slate-50/70 bg-white'}`}
                                  >
                                    <td className="px-4 py-3 pl-8 text-xs text-slate-400">
                                      <span className="flex items-center gap-1.5 font-normal">
                                        <span className="text-slate-300">└─</span>
                                        <span className="text-slate-500">{row.kapanewon}</span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 font-medium">{row.kalurahan}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(row.jumlah_keluarga || 0).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(row.desil_1_5 || 0).toLocaleString('id-ID')}</td>

                                    {/* KK DAFTAR */}
                                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-semibold text-gray-900">{Number(row.kk_daftar || 0).toLocaleString('id-ID')}</span>
                                        <div className="flex flex-col items-end text-[10px] text-gray-500">
                                          <span>
                                            vs Desil: <span className="font-medium text-gray-700">{row.desil_1_5 > 0 ? `${((row.kk_daftar / row.desil_1_5) * 100).toFixed(1)}%` : '0.0%'}</span>
                                          </span>
                                          <span>
                                            vs Populasi: <span className="font-medium text-gray-700">{row.jumlah_keluarga > 0 ? `${((row.kk_daftar / row.jumlah_keluarga) * 100).toFixed(1)}%` : '0.0%'}</span>
                                          </span>
                                        </div>
                                        {(filterMode === 'lowest-kk-populasi' || filterMode === 'lowest-kk-rentan') && (
                                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {activeRate.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* BPNT DAFTAR */}
                                    <td className="px-4 py-3 text-right tabular-nums">
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-semibold text-gray-900">{Number(row.bpnt_daftar || 0).toLocaleString('id-ID')}</span>
                                        <div className="text-[10px] text-gray-500">
                                          <span className="font-medium text-slate-600">
                                            {row.penerima_bpnt > 0 ? `${((row.bpnt_daftar / row.penerima_bpnt) * 100).toFixed(1)}% Usulan` : '0% Usulan'}
                                          </span>
                                        </div>
                                        {(filterMode === 'lowest-bpnt' || filterMode === 'sort_realisasi_bpnt_terendah') && (
                                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {row.bpntRealisasiRate.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* PENERIMA BPNT */}
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(row.penerima_bpnt || 0).toLocaleString('id-ID')}</td>

                                    {/* PKH DAFTAR */}
                                    <td className="px-4 py-3 text-right tabular-nums">
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-semibold text-gray-900">{Number(row.pkh_daftar || 0).toLocaleString('id-ID')}</span>
                                        <div className="text-[10px] text-gray-500">
                                          <span className="font-medium text-slate-600">
                                            {row.penerima_pkh > 0 ? `${((row.pkh_daftar / row.penerima_pkh) * 100).toFixed(1)}% Usulan` : '0% Usulan'}
                                          </span>
                                        </div>
                                        {(filterMode === 'lowest-pkh' || filterMode === 'sort_realisasi_pkh_terendah') && (
                                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {row.pkhRealisasiRate.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* PENERIMA PKH */}
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(row.penerima_pkh || 0).toLocaleString('id-ID')}</td>

                                    {/* AGEN */}
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(row.agen || 0).toLocaleString('id-ID')}</td>

                                    {/* AGEN AKTIF */}
                                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">{Number(row.agen_aktif || 0).toLocaleString('id-ID')}</td>

                                    {/* KK VIA AGEN */}
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span>{Number(row.kk_via_agen || 0).toLocaleString('id-ID')}</span>
                                        {filterMode === 'lowest-agen' && (
                                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {row.agenKinerjaRate.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                  {data.length > 0 && (
                    <tfoot className="bg-slate-100 font-semibold text-gray-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={2} className="px-4 py-3.5 text-right uppercase text-[11px] font-bold text-slate-700">TOTAL KESELURUHAN</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-blue-700 font-bold">{metrics.totalKeluarga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-orange-700 font-bold">{metrics.totalRentan.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-emerald-700 font-bold">{metrics.totalKKDaftar.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-amber-700 font-bold">{metrics.totalBPNTDaftar.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-slate-800 font-bold">{metrics.totalPenerimaBPNT.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-rose-700 font-bold">{metrics.totalPKHDaftar.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-slate-800 font-bold">{metrics.totalPenerimaPKH.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-slate-800 font-bold">{metrics.totalAgen.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-teal-700 font-bold">{metrics.totalAgenAktif.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-blue-700 font-bold">{metrics.totalKKViaAgen.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
