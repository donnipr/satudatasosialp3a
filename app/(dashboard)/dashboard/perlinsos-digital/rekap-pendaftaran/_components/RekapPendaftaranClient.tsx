'use client';

import { useState, useRef, useMemo, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseView, notifyPerlinsosDataChanged } from '@/lib/hooks/useSupabaseView';
import { Loader2, Plus, Upload, Edit, Trash2, X, Download, TrendingDown, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp, Search } from 'lucide-react';
import Papa from 'papaparse';

interface RekapPendaftaran {
  id?: number | string;
  kapanewon: string;
  kalurahan: string;
  jumlah_keluarga: number;
  desil_1_5: number;
  kk_daftar: number;
  penerima_bpnt: number;
  bpnt_daftar: number;
  penerima_pkh: number;
  pkh_daftar: number;
  /** Total agents as exposed by view_perlinsos_dtsen (base-table column is `agen`). */
  total_agen?: number;
  /** Legacy name; only present on base-table rows / old view versions. */
  agen?: number;
  agen_aktif: number;
  kk_via_agen: number;
  total_pendaftar?: number;
  periode_dtsen?: string;
  tahun?: string | number;
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

const TABLE_NAME = 'rekap_pendaftaran_perlinsos';

export default function RekapPendaftaranClient() {
  const router = useRouter();

  // Fetches on mount, on tab focus, on cross-tab notify, and on Realtime changes.
  const {
    data: rawData,
    loading,
    error,
    refetch,
  } = useSupabaseView<RekapPendaftaran>('view_perlinsos_dtsen', {
    orderBy: [{ column: 'kapanewon' }, { column: 'kalurahan' }],
    realtimeTables: [TABLE_NAME],
  });
  const [saving, setSaving] = useState(false);

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchKapanewon, setSearchKapanewon] = useState('');
  const [searchKalurahan, setSearchKalurahan] = useState('');

  // Collapsible Kapanewon groups tracking
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hasInitializedExpanded, setHasInitializedExpanded] = useState(false);

  // Initialize all Kapanewons as expanded on first data load
  useEffect(() => {
    if (rawData.length > 0 && !hasInitializedExpanded) {
      const all = new Set(rawData.map((d) => d.kapanewon).filter(Boolean));
      setExpandedGroups(all);
      setHasInitializedExpanded(true);
    }
  }, [rawData, hasInitializedExpanded]);

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
    const all = new Set(rawData.map((d) => d.kapanewon).filter(Boolean));
    setExpandedGroups(all);
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
  };
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState({
    kapanewon: '',
    kalurahan: '',
    kk_daftar: 0,
    bpnt_daftar: 0,
    penerima_bpnt: 0,
    pkh_daftar: 0,
    penerima_pkh: 0,
    agen: 0,
    agen_aktif: 0,
    kk_via_agen: 0,
  });
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  /** Pull fresh rows into state, invalidate the router cache, and tell other tabs. */
  const syncAfterMutation = async () => {
    await refetch();
    router.refresh();
    notifyPerlinsosDataChanged();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      kapanewon: formData.kapanewon,
      kalurahan: formData.kalurahan,
      kk_daftar: Number(formData.kk_daftar || 0),
      bpnt_daftar: Number(formData.bpnt_daftar || 0),
      penerima_bpnt: Number(formData.penerima_bpnt || 0),
      pkh_daftar: Number(formData.pkh_daftar || 0),
      penerima_pkh: Number(formData.penerima_pkh || 0),
      agen: Number(formData.agen || 0),
      agen_aktif: Number(formData.agen_aktif || 0),
      kk_via_agen: Number(formData.kk_via_agen || 0),
      total_pendaftar: Number(formData.kk_daftar || 0),
    };

    try {
      let written = false;

      if (editId) {
        // .select() returns the affected rows so a silent no-op (id mismatch / RLS) is detectable
        const { data: updated, error } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editId)
          .select('id');
        if (error) throw error;
        written = (updated?.length ?? 0) > 0;
      }

      if (!written) {
        // New row, or the view's id didn't match a base-table row: write by natural key
        const { error } = await supabase
          .from(TABLE_NAME)
          .upsert(payload, { onConflict: 'kapanewon,kalurahan', ignoreDuplicates: false });
        if (error) throw error;
      }

      setIsModalOpen(false);
      await syncAfterMutation();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: number | string) => {
    if (!id) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      const { data: deleted, error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw error;
      if (!deleted || deleted.length === 0) {
        alert('Tidak ada baris yang terhapus. Periksa apakah ID pada view sesuai dengan tabel rekap atau kebijakan RLS.');
      }
      await syncAfterMutation();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      kapanewon: '',
      kalurahan: '',
      kk_daftar: 0,
      bpnt_daftar: 0,
      penerima_bpnt: 0,
      pkh_daftar: 0,
      penerima_pkh: 0,
      agen: 0,
      agen_aktif: 0,
      kk_via_agen: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: RekapPendaftaran) => {
    setEditId(row.id ?? null);
    setFormData({
      kapanewon: row.kapanewon,
      kalurahan: row.kalurahan,
      kk_daftar: Number(row.kk_daftar ?? row.total_pendaftar ?? 0),
      bpnt_daftar: Number(row.bpnt_daftar || 0),
      penerima_bpnt: Number(row.penerima_bpnt || 0),
      pkh_daftar: Number(row.pkh_daftar || 0),
      penerima_pkh: Number(row.penerima_pkh || 0),
      agen: Number(row.total_agen ?? row.agen ?? 0),
      agen_aktif: Number(row.agen_aktif || 0),
      kk_via_agen: Number(row.kk_via_agen || 0),
    });
    setIsModalOpen(true);
  };

  const downloadTemplate = () => {
    const headers = [
      "kapanewon", "kalurahan", 
      "kk_daftar", "bpnt_daftar", "penerima_bpnt", 
      "pkh_daftar", "penerima_pkh", 
      "agen", "agen_aktif", "kk_via_agen", 
      "periode_dtsen", "tahun"
    ];

    const exampleRow = [
      "Wonosari", "Wunung",
      "320", "280", "275",
      "150", "148",
      "8", "6", "110",
      "Periode 3.2", "2024"
    ];

    const csvContent = `${headers.join(',')}\n${exampleRow.join(',')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_pendaftaran_perlinsos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedData = results.data
            .filter((row: any) => row.kapanewon && row.kalurahan)
            .map((row: any) => {
              const kkDaftar = parseInt(row.kk_daftar, 10) || parseInt(row.total_pendaftar, 10) || 0;
              return {
                kapanewon: String(row.kapanewon).trim(),
                kalurahan: String(row.kalurahan).trim(),
                kk_daftar: kkDaftar,
                bpnt_daftar: parseInt(row.bpnt_daftar, 10) || 0,
                penerima_bpnt: parseInt(row.penerima_bpnt, 10) || 0,
                pkh_daftar: parseInt(row.pkh_daftar, 10) || 0,
                penerima_pkh: parseInt(row.penerima_pkh, 10) || 0,
                agen: parseInt(row.agen, 10) || 0,
                agen_aktif: parseInt(row.agen_aktif, 10) || 0,
                kk_via_agen: parseInt(row.kk_via_agen, 10) || 0,
                periode_dtsen: row.periode_dtsen || 'Periode 3.2',
                tahun: parseInt(row.tahun, 10) || new Date().getFullYear(),
                total_pendaftar: kkDaftar,
              };
            });

          if (formattedData.length === 0) {
            alert('Tidak ada baris data valid yang ditemukan dalam file CSV.');
            return;
          }

          const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(formattedData, {
              onConflict: 'kapanewon,kalurahan',
              ignoreDuplicates: false
            });
            
          if (error) throw error;

          // Refresh state BEFORE the blocking alert so the table is already updated behind it
          await syncAfterMutation();
          // alert() blocks painting; wait one frame so the updated table is visible first
          await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
          alert(`Berhasil mengimpor ${formattedData.length} baris data CSV!`);
        } catch (error: any) {
          alert(error.message || 'Gagal import data CSV');
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        alert(error.message);
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const totalSum = useMemo(() => {
    return rawData.reduce(
      (acc, curr) => {
        acc.jumlah_keluarga += Number(curr.jumlah_keluarga || 0);
        acc.desil_1_5 += Number(curr.desil_1_5 || 0);
        acc.kk_daftar += Number(curr.kk_daftar ?? curr.total_pendaftar ?? 0);
        acc.bpnt_daftar += Number(curr.bpnt_daftar || 0);
        acc.penerima_bpnt += Number(curr.penerima_bpnt || 0);
        acc.pkh_daftar += Number(curr.pkh_daftar || 0);
        acc.penerima_pkh += Number(curr.penerima_pkh || 0);
        acc.agen += Number(curr.total_agen ?? curr.agen ?? 0);
        acc.agen_aktif += Number(curr.agen_aktif || 0);
        acc.kk_via_agen += Number(curr.kk_via_agen || 0);
        return acc;
      },
      {
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
      }
    );
  }, [rawData]);

  const filteredAndSortedData = useMemo(() => {
    if (!rawData) return [];

    // Step 1: Text search filter (case-insensitive)
    const filtered = rawData.filter((item) => {
      const matchKapanewon = item.kapanewon?.toLowerCase().includes(searchKapanewon.toLowerCase()) ?? true;
      const matchKalurahan = item.kalurahan?.toLowerCase().includes(searchKalurahan.toLowerCase()) ?? true;
      return matchKapanewon && matchKalurahan;
    });

    const processedData = filtered.map((row) => {
      const jumlahKeluarga = Number(row.jumlah_keluarga || 0);
      const desil15 = Number(row.desil_1_5 || 0);
      const kkDaftar = Number(row.kk_daftar ?? row.total_pendaftar ?? 0);
      const bpntDaftar = Number(row.bpnt_daftar || 0);
      const penerimaBpnt = Number(row.penerima_bpnt || 0);
      const pkhDaftar = Number(row.pkh_daftar || 0);
      const penerimaPkh = Number(row.penerima_pkh || 0);
      const agen = Number(row.total_agen ?? row.agen ?? 0);
      const agenAktif = Number(row.agen_aktif || 0);
      const kkViaAgen = Number(row.kk_via_agen || 0);

      // Calculations per analytical angles
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
        agen: agen,
        agen_aktif: agenAktif,
        kk_via_agen: kkViaAgen,
        kkPopulasiRate, 
        kkRentanRate, 
        pkhRealisasiRate, 
        bpntRealisasiRate, 
        agenKinerjaRate 
      };
    });

    switch (filterMode) {
      case 'sort_capaian_desil_tertinggi':
        // Sort descending (highest coverage at the top)
        processedData.sort((a, b) => {
          const rateA = a.desil_1_5 > 0 ? (a.kk_daftar / a.desil_1_5) : 0;
          const rateB = b.desil_1_5 > 0 ? (b.kk_daftar / b.desil_1_5) : 0;
          return rateB - rateA; 
        });
        break;

      case 'sort_capaian_desil_terendah':
        // Sort ascending (lowest coverage at the top for intervention)
        processedData.sort((a, b) => {
          const rateA = a.desil_1_5 > 0 ? (a.kk_daftar / a.desil_1_5) : 0;
          const rateB = b.desil_1_5 > 0 ? (b.kk_daftar / b.desil_1_5) : 0;
          return rateA - rateB; 
        });
        break;

      case 'sort_realisasi_bpnt_tertinggi':
        processedData.sort((a, b) => {
          const rateA = a.penerima_bpnt > 0 ? (a.bpnt_daftar / a.penerima_bpnt) : 0;
          const rateB = b.penerima_bpnt > 0 ? (b.bpnt_daftar / b.penerima_bpnt) : 0;
          return rateB - rateA;
        });
        break;

      case 'sort_realisasi_bpnt_terendah':
        processedData.sort((a, b) => {
          const rateA = a.penerima_bpnt > 0 ? (a.bpnt_daftar / a.penerima_bpnt) : 0;
          const rateB = b.penerima_bpnt > 0 ? (b.bpnt_daftar / b.penerima_bpnt) : 0;
          return rateA - rateB;
        });
        break;

      case 'sort_realisasi_pkh_tertinggi':
        processedData.sort((a, b) => {
          const rateA = a.penerima_pkh > 0 ? (a.pkh_daftar / a.penerima_pkh) : 0;
          const rateB = b.penerima_pkh > 0 ? (b.pkh_daftar / b.penerima_pkh) : 0;
          return rateB - rateA;
        });
        break;

      case 'sort_realisasi_pkh_terendah':
        processedData.sort((a, b) => {
          const rateA = a.penerima_pkh > 0 ? (a.pkh_daftar / a.penerima_pkh) : 0;
          const rateB = b.penerima_pkh > 0 ? (b.pkh_daftar / b.penerima_pkh) : 0;
          return rateA - rateB;
        });
        break;

      case 'lowest-kk-populasi':
        return [...processedData].sort((a, b) => a.kkPopulasiRate - b.kkPopulasiRate);
      case 'lowest-kk-rentan':
        return [...processedData].sort((a, b) => a.kkRentanRate - b.kkRentanRate);
      case 'lowest-pkh':
        return [...processedData].sort((a, b) => a.pkhRealisasiRate - b.pkhRealisasiRate);
      case 'lowest-bpnt':
        return [...processedData].sort((a, b) => a.bpntRealisasiRate - b.bpntRealisasiRate);
      case 'lowest-agen':
        return [...processedData].sort((a, b) => a.agenKinerjaRate - b.agenKinerjaRate);
      default:
        return processedData;
    }

    return processedData;
  }, [rawData, filterMode, searchKapanewon, searchKalurahan]);

  // Group filtered data by Kapanewon and compute subtotal aggregations
  const groupedData = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return [];

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
      rows: typeof filteredAndSortedData;
    }>();

    filteredAndSortedData.forEach((row) => {
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
      group.subtotals.jumlah_keluarga += Number(row.jumlah_keluarga || 0);
      group.subtotals.desil_1_5 += Number(row.desil_1_5 || 0);
      group.subtotals.kk_daftar += Number(row.kk_daftar || 0);
      group.subtotals.bpnt_daftar += Number(row.bpnt_daftar || 0);
      group.subtotals.penerima_bpnt += Number(row.penerima_bpnt || 0);
      group.subtotals.pkh_daftar += Number(row.pkh_daftar || 0);
      group.subtotals.penerima_pkh += Number(row.penerima_pkh || 0);
      group.subtotals.agen += Number(row.agen || 0);
      group.subtotals.agen_aktif += Number(row.agen_aktif || 0);
      group.subtotals.kk_via_agen += Number(row.kk_via_agen || 0);
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
        // 'all' preserves alphabetical order from the query
        break;
    }

    return groups;
  }, [filteredAndSortedData, filterMode]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Rekap Pendaftaran Perlinsos Digital</h1>
          <p className="text-sm text-gray-500">
            Data rekapitulasi komprehensif pendaftaran perlindungan sosial, verifikasi program (PKH & BPNT), dan kinerja agen per kalurahan.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4"/>
            <span>Template CSV</span>
          </button>
          
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Import CSV</span>
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari Kapanewon..."
              value={searchKapanewon}
              onChange={(e) => setSearchKapanewon(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari Kalurahan..."
              value={searchKalurahan}
              onChange={(e) => setSearchKalurahan(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={handleExpandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              title="Buka semua grup Kapanewon"
            >
              <ChevronsDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Semua</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200" />
            <button
              type="button"
              onClick={handleCollapseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
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
              className={`w-full sm:w-auto appearance-none pl-9 pr-8 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm outline-none cursor-pointer ${filterMode !== 'all' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
            >
              <option value="all">Semua Data</option>
              <option value="sort_capaian_desil_tertinggi">Capaian Target Tertinggi (KK Daftar vs Desil 1-5)</option>
              <option value="sort_capaian_desil_terendah">Capaian Target Terendah (KK Daftar vs Desil 1-5)</option>
              <option value="sort_realisasi_bpnt_tertinggi">Realisasi/Usulan BPNT Tertinggi (Daftar vs Penerima)</option>
              <option value="sort_realisasi_bpnt_terendah">Realisasi/Usulan BPNT Terendah (Daftar vs Penerima)</option>
              <option value="sort_realisasi_pkh_tertinggi">Realisasi/Usulan PKH Tertinggi (Daftar vs Penerima)</option>
              <option value="sort_realisasi_pkh_terendah">Realisasi/Usulan PKH Terendah (Daftar vs Penerima)</option>
              <option value="lowest-kk-populasi">Sorot KK Daftar vs Jumlah Keluarga Terendah</option>
              <option value="lowest-kk-rentan">Sorot KK Daftar vs Desil 1-5 Terendah</option>
              <option value="lowest-pkh">Sorot Realisasi PKH Terendah</option>
              <option value="lowest-bpnt">Sorot Realisasi BPNT Terendah</option>
              <option value="lowest-agen">Sorot Kinerja Agen Terendah</option>
            </select>
            <TrendingDown className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${filterMode !== 'all' ? 'text-orange-600' : 'text-slate-500'}`}/>
            <ChevronDown className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${filterMode !== 'all' ? 'text-orange-600' : 'text-slate-500'}`}/>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-0">
          {loading && rawData.length === 0 ? (
            <div className="flex justify-center items-center p-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-red-500 text-center">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-700 bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-4 font-semibold uppercase">KAPANEWON</th>
                    <th className="px-5 py-4 font-semibold uppercase">KALURAHAN</th>
                    <th className="px-5 py-4 font-semibold text-right">JUMLAH KELUARGA</th>
                    <th className="px-5 py-4 font-semibold text-right">DESIL 1-5</th>
                    <th className="px-5 py-4 font-semibold text-right">KK DAFTAR</th>
                    <th className="px-5 py-4 font-semibold text-right">BPNT DAFTAR</th>
                    <th className="px-5 py-4 font-semibold text-right">PENERIMA BPNT</th>
                    <th className="px-5 py-4 font-semibold text-right">PKH DAFTAR</th>
                    <th className="px-5 py-4 font-semibold text-right">PENERIMA PKH</th>
                    <th className="px-5 py-4 font-semibold text-right">AGEN</th>
                    <th className="px-5 py-4 font-semibold text-right">AGEN AKTIF</th>
                    <th className="px-5 py-4 font-semibold text-right">KK VIA AGEN</th>
                    <th className="px-5 py-4 font-semibold text-center uppercase">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groupedData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                        {searchKapanewon || searchKalurahan
                          ? 'Tidak ada data yang cocok dengan kriteria pencarian'
                          : 'Tidak ada data ditemukan'}
                      </td>
                    </tr>
                  ) : (
                    groupedData.map((group) => {
                      const isExpanded = isGroupExpanded(group.kapanewon);
                      const sub = group.subtotals;

                      // Highlight group when subtotal meets low-coverage thresholds
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
                        <Fragment key={`group-block-${group.kapanewon}`}>
                          {/* Parent Row (Kapanewon Header & Subtotal) */}
                          <tr
                            onClick={() => toggleGroup(group.kapanewon)}
                            className="bg-slate-100/95 hover:bg-slate-200/80 cursor-pointer transition-colors border-y border-slate-300 font-semibold text-slate-900 select-none"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="p-0.5 text-slate-600">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-700" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-700" />
                                  )}
                                </div>
                                <span className="font-bold text-gray-900 text-sm tracking-tight">
                                  {group.kapanewon}
                                </span>
                                <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-300 px-2 py-0.5 rounded-full shadow-2xs">
                                  {group.rows.length} Kalurahan
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500 italic font-medium">
                              Subtotal
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold text-slate-900">
                              {sub.jumlah_keluarga.toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold text-slate-900">
                              {sub.desil_1_5.toLocaleString('id-ID')}
                            </td>
                            
                            {/* Subtotal KK Daftar */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="font-bold text-slate-900">{sub.kk_daftar.toLocaleString('id-ID')}</span>
                                <div className="flex flex-col items-end text-[11px] text-slate-500 font-normal">
                                  <span>
                                    vs Desil: <span className="font-semibold text-slate-700">{sub.kkRentanRate.toFixed(1)}%</span>
                                  </span>
                                  <span>
                                    vs Pop: <span className="font-semibold text-slate-700">{sub.kkPopulasiRate.toFixed(1)}%</span>
                                  </span>
                                </div>
                                {(filterMode === 'lowest-kk-populasi' || filterMode === 'lowest-kk-rentan') && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {groupActiveRate.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Subtotal BPNT Daftar */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="font-bold text-slate-900">{sub.bpnt_daftar.toLocaleString('id-ID')}</span>
                                <div className="text-[11px] text-slate-500 font-normal">
                                  <span className="font-medium text-slate-700">
                                    {sub.penerima_bpnt > 0 ? `${sub.bpntRealisasiRate.toFixed(1)}% Usulan` : '0% Usulan'}
                                  </span>
                                </div>
                                {(filterMode === 'lowest-bpnt' || filterMode === 'sort_realisasi_bpnt_terendah') && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {sub.bpntRealisasiRate.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Subtotal Penerima BPNT */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold text-slate-900">
                              {sub.penerima_bpnt.toLocaleString('id-ID')}
                            </td>

                            {/* Subtotal PKH Daftar */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="font-bold text-slate-900">{sub.pkh_daftar.toLocaleString('id-ID')}</span>
                                <div className="text-[11px] text-slate-500 font-normal">
                                  <span className="font-medium text-slate-700">
                                    {sub.penerima_pkh > 0 ? `${sub.pkhRealisasiRate.toFixed(1)}% Usulan` : '0% Usulan'}
                                  </span>
                                </div>
                                {(filterMode === 'lowest-pkh' || filterMode === 'sort_realisasi_pkh_terendah') && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {sub.pkhRealisasiRate.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Subtotal Penerima PKH */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold text-slate-900">
                              {sub.penerima_pkh.toLocaleString('id-ID')}
                            </td>

                            {/* Subtotal Agen */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold text-slate-900">
                              {sub.agen.toLocaleString('id-ID')}
                            </td>

                            {/* Subtotal Agen Aktif */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold text-emerald-700">
                              {sub.agen_aktif.toLocaleString('id-ID')}
                            </td>

                            {/* Subtotal KK via Agen */}
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-slate-900">{sub.kk_via_agen.toLocaleString('id-ID')}</span>
                                {filterMode === 'lowest-agen' && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isGroupLowCoverage ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {sub.agenKinerjaRate.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Parent Row Toggle indicator */}
                            <td className="px-5 py-3.5 text-center">
                              <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-300 px-2 py-0.5 rounded shadow-2xs">
                                {isExpanded ? 'Tutup' : 'Buka'}
                              </span>
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
                                  className={`transition-colors ${isLowCoverage ? 'bg-red-50/80 hover:bg-red-100/80' : 'hover:bg-slate-50/70 bg-white'}`}
                                >
                                  <td className="px-5 py-3.5 pl-9 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5 font-normal">
                                      <span className="text-slate-300">└─</span>
                                      <span className="text-slate-500">{row.kapanewon}</span>
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 font-medium text-gray-900">
                                    {row.kalurahan}
                                  </td>
                                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                                    {Number(row.jumlah_keluarga || 0).toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                                    {Number(row.desil_1_5 || 0).toLocaleString('id-ID')}
                                  </td>

                                  {/* KK DAFTAR */}
                                  <td className="px-5 py-3.5 text-right tabular-nums font-medium">
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="font-semibold text-gray-900">
                                        {Number(row.kk_daftar || 0).toLocaleString('id-ID')}
                                      </span>
                                      <div className="flex flex-col items-end text-xs text-gray-500 space-y-0.5">
                                        <span className="text-[11px] leading-tight">
                                          vs Desil: <span className="font-medium text-gray-700">{row.desil_1_5 > 0 ? `${((row.kk_daftar / row.desil_1_5) * 100).toFixed(1)}%` : '0.0%'}</span>
                                        </span>
                                        <span className="text-[11px] leading-tight">
                                          vs Populasi: <span className="font-medium text-gray-700">{row.jumlah_keluarga > 0 ? `${((row.kk_daftar / row.jumlah_keluarga) * 100).toFixed(1)}%` : '0.0%'}</span>
                                        </span>
                                      </div>
                                      {(filterMode === 'lowest-kk-populasi' || filterMode === 'lowest-kk-rentan') && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {activeRate.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* BPNT DAFTAR */}
                                  <td className="px-5 py-3.5 text-right tabular-nums">
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="font-semibold text-gray-900">
                                        {Number(row.bpnt_daftar || 0).toLocaleString('id-ID')}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        <span className="text-[11px] leading-tight font-medium text-slate-600">
                                          {row.penerima_bpnt > 0 ? `${((row.bpnt_daftar / row.penerima_bpnt) * 100).toFixed(1)}% Usulan` : '0% Usulan'}
                                        </span>
                                      </div>
                                      {(filterMode === 'lowest-bpnt' || filterMode === 'sort_realisasi_bpnt_terendah') && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {row.bpntRealisasiRate.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* PENERIMA BPNT */}
                                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                                    {Number(row.penerima_bpnt || 0).toLocaleString('id-ID')}
                                  </td>

                                  {/* PKH DAFTAR */}
                                  <td className="px-5 py-3.5 text-right tabular-nums">
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="font-semibold text-gray-900">
                                        {Number(row.pkh_daftar || 0).toLocaleString('id-ID')}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        <span className="text-[11px] leading-tight font-medium text-slate-600">
                                          {row.penerima_pkh > 0 ? `${((row.pkh_daftar / row.penerima_pkh) * 100).toFixed(1)}% Usulan` : '0% Usulan'}
                                        </span>
                                      </div>
                                      {(filterMode === 'lowest-pkh' || filterMode === 'sort_realisasi_pkh_terendah') && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {row.pkhRealisasiRate.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* PENERIMA PKH */}
                                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                                    {Number(row.penerima_pkh || 0).toLocaleString('id-ID')}
                                  </td>

                                  {/* AGEN */}
                                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                                    {Number(row.agen || 0).toLocaleString('id-ID')}
                                  </td>

                                  {/* AGEN AKTIF */}
                                  <td className="px-5 py-3.5 text-right tabular-nums text-emerald-600 font-medium">
                                    {Number(row.agen_aktif || 0).toLocaleString('id-ID')}
                                  </td>

                                  {/* KK VIA AGEN */}
                                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                                    <div className="flex flex-col items-end gap-1">
                                      <span>{Number(row.kk_via_agen || 0).toLocaleString('id-ID')}</span>
                                      {filterMode === 'lowest-agen' && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLowCoverage ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {row.agenKinerjaRate.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* AKSI */}
                                  <td className="px-5 py-3.5 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => openEditModal(row)}
                                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                        title="Edit"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(row.id)}
                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                        title="Hapus"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
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
                {rawData.length > 0 && (
                  <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-5 py-4 text-right uppercase">TOTAL KESELURUHAN</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.jumlah_keluarga.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.desil_1_5.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.kk_daftar.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.bpnt_daftar.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.penerima_bpnt.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.pkh_daftar.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.penerima_pkh.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.agen.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-emerald-600">{totalSum.agen_aktif.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-red-600">{totalSum.kk_via_agen.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {editId ? 'Edit Data Pendaftaran' : 'Tambah Data Pendaftaran'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kapanewon</label>
                    <input
                      type="text"
                      required
                      value={formData.kapanewon}
                      onChange={(e) => setFormData({ ...formData, kapanewon: e.target.value })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kalurahan</label>
                    <input
                      type="text"
                      required
                      value={formData.kalurahan}
                      onChange={(e) => setFormData({ ...formData, kalurahan: e.target.value })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KK Daftar</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.kk_daftar}
                      onChange={(e) => setFormData({ ...formData, kk_daftar: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BPNT Daftar</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bpnt_daftar}
                      onChange={(e) => setFormData({ ...formData, bpnt_daftar: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Penerima BPNT</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.penerima_bpnt}
                      onChange={(e) => setFormData({ ...formData, penerima_bpnt: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PKH Daftar</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.pkh_daftar}
                      onChange={(e) => setFormData({ ...formData, pkh_daftar: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Penerima PKH</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.penerima_pkh}
                      onChange={(e) => setFormData({ ...formData, penerima_pkh: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agen</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.agen}
                      onChange={(e) => setFormData({ ...formData, agen: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agen Aktif</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.agen_aktif}
                      onChange={(e) => setFormData({ ...formData, agen_aktif: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KK via Agen</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kk_via_agen}
                      onChange={(e) => setFormData({ ...formData, kk_via_agen: parseInt(e.target.value) || 0 })}
                      className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 flex-shrink-0 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-white bg-transparent transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editId ? 'Simpan Perubahan' : 'Simpan Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
