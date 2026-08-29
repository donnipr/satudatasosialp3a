'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Users, TrendingUp, MapPin, Download, Plus, Upload, RefreshCcw, X, Save, Trash2, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';

export interface PPKSRow {
  id?: string;
  kapanewon: string;
  kalurahan: string;
  tahun: number;
  adk: number;
  pd: number;
  abt: number;
  aj: number;
  aktk: number;
  at: number;
  bwblp: number;
  gel: number;
  kbsp: number;
  kpn: number;
  ktk: number;
  lut: number;
  pem: number;
  peng: number;
  pmbs: number;
  prse: number;
  created_at?: string;
}

const CATEGORY_MAP: Record<keyof Omit<PPKSRow, 'id' | 'kapanewon' | 'kalurahan' | 'tahun' | 'created_at'>, string> = {
  adk: 'Anak Dengan Kedisabilitasan',
  pd: 'Penyandang Disabilitas',
  abt: 'Anak Balita Terlantar',
  aj: 'Anak Jalanan',
  aktk: 'Anak Korban Tindak Kekerasan',
  at: 'Anak Terlantar',
  bwblp: 'Bekas Warga Binaan Lembaga Pemasyarakatan',
  gel: 'Gelandangan',
  kbsp: 'Keluarga Bermasalah Sosial Psikologis',
  kpn: 'Korban Penyalahgunaan Napza',
  ktk: 'Korban Tindak Kekerasan',
  lut: 'Lanjut Usia Terlantar',
  pem: 'Pemulung',
  peng: 'Pengemis',
  pmbs: 'Pekerja Migran Bermasalah Sosial',
  prse: 'Perempuan Rawan Sosial Ekonomi'
};

const PPKS_CATEGORIES = Object.entries(CATEGORY_MAP).map(([id, label]) => ({
  id,
  label: `${label} (${id.toUpperCase()})`
}));

const MOCK_DATA: PPKSRow[] = [
  { id: '1', kapanewon: 'Gedangsari', kalurahan: 'Hargomulyo', tahun: 2024, adk: 5, pd: 42, abt: 2, aj: 0, aktk: 1, at: 3, bwblp: 0, gel: 0, kbsp: 12, kpn: 0, ktk: 2, lut: 85, pem: 0, peng: 0, pmbs: 1, prse: 45 },
  { id: '2', kapanewon: 'Gedangsari', kalurahan: 'Mertelu', tahun: 2024, adk: 3, pd: 38, abt: 1, aj: 0, aktk: 0, at: 5, bwblp: 1, gel: 0, kbsp: 8, kpn: 0, ktk: 1, lut: 92, pem: 0, peng: 0, pmbs: 0, prse: 33 },
  { id: '3', kapanewon: 'Gedangsari', kalurahan: 'Ngalang', tahun: 2024, adk: 7, pd: 55, abt: 4, aj: 1, aktk: 2, at: 8, bwblp: 0, gel: 1, kbsp: 15, kpn: 0, ktk: 4, lut: 110, pem: 2, peng: 0, pmbs: 3, prse: 62 },
  { id: '4', kapanewon: 'Gedangsari', kalurahan: 'Tegalrejo', tahun: 2024, adk: 2, pd: 25, abt: 0, aj: 0, aktk: 0, at: 2, bwblp: 0, gel: 0, kbsp: 5, kpn: 0, ktk: 0, lut: 65, pem: 0, peng: 0, pmbs: 0, prse: 28 },
  { id: '5', kapanewon: 'Gedangsari', kalurahan: 'Sampang', tahun: 2024, adk: 4, pd: 30, abt: 1, aj: 0, aktk: 1, at: 4, bwblp: 0, gel: 0, kbsp: 7, kpn: 0, ktk: 1, lut: 78, pem: 0, peng: 0, pmbs: 1, prse: 35 },
  { id: '6', kapanewon: 'Nglipar', kalurahan: 'Kedungpoh', tahun: 2024, adk: 6, pd: 48, abt: 3, aj: 0, aktk: 1, at: 6, bwblp: 2, gel: 0, kbsp: 10, kpn: 1, ktk: 3, lut: 95, pem: 1, peng: 0, pmbs: 2, prse: 50 },
  { id: '7', kapanewon: 'Nglipar', kalurahan: 'Natah', tahun: 2024, adk: 3, pd: 35, abt: 1, aj: 0, aktk: 0, at: 3, bwblp: 0, gel: 0, kbsp: 6, kpn: 0, ktk: 1, lut: 70, pem: 0, peng: 0, pmbs: 1, prse: 40 },
  { id: '8', kapanewon: 'Wonosari', kalurahan: 'Baleharjo', tahun: 2024, adk: 8, pd: 60, abt: 5, aj: 4, aktk: 3, at: 10, bwblp: 5, gel: 3, kbsp: 25, kpn: 2, ktk: 8, lut: 150, pem: 12, peng: 5, pmbs: 5, prse: 85 },
  { id: '9', kapanewon: 'Wonosari', kalurahan: 'Kepek', tahun: 2024, adk: 5, pd: 45, abt: 2, aj: 2, aktk: 1, at: 5, bwblp: 2, gel: 1, kbsp: 18, kpn: 1, ktk: 4, lut: 120, pem: 8, peng: 2, pmbs: 3, prse: 65 },
  { id: '10', kapanewon: 'Wonosari', kalurahan: 'Piyaman', tahun: 2024, adk: 4, pd: 40, abt: 2, aj: 0, aktk: 2, at: 4, bwblp: 1, gel: 0, kbsp: 14, kpn: 0, ktk: 2, lut: 105, pem: 3, peng: 0, pmbs: 2, prse: 55 },
];

const INITIAL_FORM_DATA: Omit<PPKSRow, 'id'> = {
  kapanewon: '',
  kalurahan: '',
  tahun: new Date().getFullYear(),
  adk: 0, pd: 0, abt: 0, aj: 0, aktk: 0, 
  at: 0, bwblp: 0, gel: 0, kbsp: 0, kpn: 0, 
  ktk: 0, lut: 0, pem: 0, peng: 0, pmbs: 0, prse: 0
};

export default function DataPPKSPage() {
  const supabase = createClient();
  const [data, setData] = useState<PPKSRow[]>(MOCK_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKapanewon, setSelectedKapanewon] = useState('Semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('semua');
  const [selectedKalurahan, setSelectedKalurahan] = useState('Semua');

  // Reset Kalurahan when Kapanewon changes
  useEffect(() => {
    setSelectedKalurahan('Semua');
  }, [selectedKapanewon]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<PPKSRow, 'id'>>(INITIAL_FORM_DATA);

  const fetchPPKSData = async () => {
    try {
      const { data: fetchedData, error } = await supabase
        .from('ppks_data')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching PPKS:', error);
        // Fallback to MOCK_DATA if table doesn't exist or error occurs
        alert('Gagal memuat data dari database. Menampilkan data lokal.');
        setData(MOCK_DATA); 
      } else if (fetchedData) {
        setData(fetchedData as PPKSRow[]);
      } else {
        setData(MOCK_DATA);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setData(MOCK_DATA);
    }
  };

  useEffect(() => {
    fetchPPKSData();
  }, []);

  const handleDownloadTemplate = () => {
    const headers = "tahun,kapanewon,kalurahan,adk,pd,abt,aj,aktk,at,bwblp,gel,kbsp,kpn,ktk,lut,pem,peng,pmbs,prse\n2025,Gedangsari,Hargomulyo,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0";
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Template_PPKS.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData = results.data.map((row: any) => ({
            tahun: parseInt(row.Tahun || row.tahun) || 2025,
            kapanewon: row.kapanewon || row.Kapanewon || '',
            kalurahan: row.kalurahan || row.Kalurahan || '',
            adk: parseInt(row.adk || row.ADK) || 0,
            pd: parseInt(row.pd || row.PD) || 0,
            abt: parseInt(row.abt || row.ABT) || 0,
            aj: parseInt(row.aj || row.AJ) || 0,
            aktk: parseInt(row.aktk || row.AKTK) || 0,
            at: parseInt(row.at || row.AT) || 0,
            bwblp: parseInt(row.bwblp || row.BWBLP) || 0,
            gel: parseInt(row.gel || row.GEL) || 0,
            kbsp: parseInt(row.kbsp || row.KBSP) || 0,
            kpn: parseInt(row.kpn || row.KPN) || 0,
            ktk: parseInt(row.ktk || row.KTK) || 0,
            lut: parseInt(row.lut || row.LUT) || 0,
            pem: parseInt(row.pem || row.PEM) || 0,
            peng: parseInt(row.PENG || row['Pengemis (PENG)'] || row.peng) || 0,
            pmbs: parseInt(row.pmbs || row.PMBS) || 0,
            prse: parseInt(row.prse || row.PRSE) || 0,
          }));

          const { error } = await supabase.from('ppks_data').insert(parsedData);
          if (error) {
            console.error("Import error DB", error);
            alert('Terjadi kesalahan saat menyimpan data ke Supabase.');
          } else {
            alert(`Berhasil membaca dan mengimport ${parsedData.length} baris data`);
            fetchPPKSData();
            setIsImportModalOpen(false);
            setSelectedFile(null);
          }
        } catch (error) {
          console.error("Import error", error);
          alert('Gagal import CSV');
        } finally {
          setIsUploading(false);
        }
      }
    });
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kapanewon || !formData.kalurahan) {
      alert('Kapanewon dan Kalurahan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure numeric fields are correctly typed
      const payloadToInsert = {
        ...formData,
        tahun: parseInt(formData.tahun as any) || new Date().getFullYear(),
        adk: parseInt(formData.adk as any) || 0,
        pd: parseInt(formData.pd as any) || 0,
        abt: parseInt(formData.abt as any) || 0,
        aj: parseInt(formData.aj as any) || 0,
        aktk: parseInt(formData.aktk as any) || 0,
        at: parseInt(formData.at as any) || 0,
        bwblp: parseInt(formData.bwblp as any) || 0,
        gel: parseInt(formData.gel as any) || 0,
        kbsp: parseInt(formData.kbsp as any) || 0,
        kpn: parseInt(formData.kpn as any) || 0,
        ktk: parseInt(formData.ktk as any) || 0,
        lut: parseInt(formData.lut as any) || 0,
        pem: parseInt(formData.pem as any) || 0,
        peng: parseInt(formData.peng as any) || 0,
        pmbs: parseInt(formData.pmbs as any) || 0,
        prse: parseInt(formData.prse as any) || 0,
      };

      const { error } = await supabase
        .from('ppks_data')
        .insert([payloadToInsert]);
      
      if (error) {
        console.error('Insert error', error);
        alert('Terjadi kesalahan saat menyimpan data ke Supabase (mungkin tabel belum dibuat). Menyimpan ke data lokal sementara.');
        
        // Optimistic UI update for demo purposes if Supabase table isn't ready
        setData(prev => [{...payloadToInsert, id: Date.now().toString()}, ...prev]);
      } else {
        alert('Data berhasil ditambahkan');
        fetchPPKSData();
      }

      setIsAddModalOpen(false);
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      const { error } = await supabase
        .from('ppks_data')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Delete error:', error);
        alert('Gagal menghapus data di Supabase (mungkin tabel belum siap). Menghapus secara lokal.');
      } else {
        alert('Data berhasil dihapus');
      }
      // Regardless of DB error (if testing with mock data), we remove from UI locally
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete exception:', err);
      alert('Gagal menghapus data');
    }
  };

  const handleNumberChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedKapanewon('Semua');
    setSelectedKalurahan('Semua');
    setSelectedKategori('semua');
  };

  const uniqueKapanewons = useMemo(() => {
    const list = Array.from(new Set(data.map(d => d.kapanewon)));
    return ['Semua', ...list.sort()];
  }, [data]);

  const availableKalurahan = useMemo(() => {
    let filtered = data;
    if (selectedKapanewon !== 'Semua') {
      filtered = filtered.filter(item => item.kapanewon === selectedKapanewon);
    }
    const unique = Array.from(new Set(filtered.map(item => item.kalurahan)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [data, selectedKapanewon]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.kapanewon.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.kalurahan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchKapanewon = selectedKapanewon === 'Semua' || item.kapanewon === selectedKapanewon;
      const matchKalurahan = selectedKalurahan === 'Semua' || item.kalurahan === selectedKalurahan;
      
      return matchSearch && matchKapanewon && matchKalurahan;
    });
  }, [data, searchTerm, selectedKapanewon, selectedKalurahan]);

  const summaryStats = useMemo(() => {
    let totalPopulasi = 0;
    const categoryTotals: Record<string, number> = {};
    
    // Initialize category totals
    PPKS_CATEGORIES.forEach(c => categoryTotals[c.id] = 0);

    filteredData.forEach(row => {
      PPKS_CATEGORIES.forEach(c => {
        const val = Number(row[c.id as keyof PPKSRow]) || 0;
        categoryTotals[c.id] += val;
        
        if (selectedKategori === 'semua' || selectedKategori === c.id) {
          totalPopulasi += val;
        }
      });
    });

    // Find top category
    let topCategory = { name: '-', count: 0 };
    if (selectedKategori === 'semua' && filteredData.length > 0) {
      const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
      if (sortedCategories[0][1] > 0) {
        const catObj = PPKS_CATEGORIES.find(c => c.id === sortedCategories[0][0]);
        topCategory = { name: catObj?.label || '-', count: sortedCategories[0][1] };
      }
    }

    return {
      totalPopulasi,
      totalKalurahan: filteredData.length,
      categoryTotals,
      topCategory
    };
  }, [filteredData, selectedKategori]);

  const categories = Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-24 relative">
      {/* Header & Unified Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Data PPKS</h1>
          <p className="text-gray-500 mt-1 text-sm">Pemerlu Pelayanan Kesejahteraan Sosial (PPKS)</p>
        </div>
        
        {/* Unified Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <Plus size={16} />
            Tambah Data
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm cursor-pointer"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={fetchPPKSData} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm">
            <RefreshCcw size={16} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Populasi Dinamis */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">
              {selectedKategori === 'semua' 
                ? 'Total Populasi Seluruh PPKS' 
                : `Total ${PPKS_CATEGORIES.find(c => c.id === selectedKategori)?.label}`}
            </p>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <Users size={20}/>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {summaryStats.totalPopulasi.toLocaleString('id-ID')} 
            <span className="text-sm font-medium text-slate-500 ml-1">Jiwa</span>
          </h3>
        </div>

        {/* Card 2: Total Kalurahan */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">Cakupan Wilayah Data</p>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <MapPin size={20}/>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {summaryStats.totalKalurahan} 
            <span className="text-sm font-medium text-slate-500 ml-1">Kalurahan</span>
          </h3>
        </div>

        {/* Card 3: Kategori Terbanyak */}
        {selectedKategori === 'semua' && (
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">Kasus Terbanyak</p>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <TrendingUp size={20}/>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 line-clamp-1" title={summaryStats.topCategory.name}>
              {summaryStats.topCategory.name}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {summaryStats.topCategory.count.toLocaleString('id-ID')} Jiwa
            </p>
          </div>
        )}
      </div>

      {/* Top Control Bar (Search & Filter) */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Cari Kapanewon, Kalurahan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg appearance-none bg-white transition-colors"
            value={selectedKapanewon}
            onChange={(e) => setSelectedKapanewon(e.target.value)}
          >
            {uniqueKapanewons.map(k => (
              <option key={k} value={k}>{k === 'Semua' ? 'Semua Kapanewon' : k}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg appearance-none bg-white transition-colors disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
            value={selectedKalurahan}
            onChange={(e) => setSelectedKalurahan(e.target.value)}
            disabled={selectedKapanewon === 'Semua' && availableKalurahan.length === 0}
          >
            <option value="Semua">Semua Kalurahan</option>
            {availableKalurahan.map(kal => (
              <option key={kal} value={kal}>{kal}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg appearance-none bg-white transition-colors"
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
          >
            <option value="semua">Semua Kategori PPKS</option>
            {PPKS_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {(searchTerm !== '' || selectedKapanewon !== 'Semua' || selectedKalurahan !== 'Semua' || selectedKategori !== 'semua') && (
          <button 
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors shrink-0"
            title="Reset semua filter"
          >
            <X size={16}/>
            <span className="hidden md:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Mini Cards for Category Totals - Only visible if 'semua' categories are selected to avoid redundancy */}
      {selectedKategori === 'semua' && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={16}/>
            Rincian Total per Kategori
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {PPKS_CATEGORIES.map((cat, index) => {
              // FIX: Force TypeScript to treat this as a solid number
              const count = Number(summaryStats.categoryTotals[cat.id]) || 0;
              const hasData = count > 0;
              
              // Rotating elegant pastel palette for active data
              const activeColors = [
                'from-blue-50 to-blue-100/60 border-blue-200 text-blue-900',
                'from-indigo-50 to-indigo-100/60 border-indigo-200 text-indigo-900',
                'from-violet-50 to-violet-100/60 border-violet-200 text-violet-900',
                'from-emerald-50 to-emerald-100/60 border-emerald-200 text-emerald-900',
                'from-amber-50 to-amber-100/60 border-amber-200 text-amber-900',
                'from-rose-50 to-rose-100/60 border-rose-200 text-rose-900',
                'from-cyan-50 to-cyan-100/60 border-cyan-200 text-cyan-900',
                'from-fuchsia-50 to-fuchsia-100/60 border-fuchsia-200 text-fuchsia-900',
              ];
              
              const activeStyle = activeColors[index % activeColors.length];
              const inactiveStyle = 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-70';

              return (
                <div 
                  key={cat.id} 
                  className={`border rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-help ${
                    hasData ? `bg-gradient-to-br shadow-sm hover:shadow-md ${activeStyle}` : inactiveStyle
                  }`}
                  title={cat.label}
                >
                  <span className={`text-[11px] font-bold tracking-wider mb-1 ${hasData ? 'opacity-70' : 'text-slate-400'}`}>
                    {cat.id.toUpperCase()}
                  </span>
                  <span className={`text-xl font-extrabold ${hasData ? '' : 'text-slate-300 font-medium'}`}>
                    {hasData ? count.toLocaleString('id-ID') : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wide Data Table */}
      <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full min-w-max text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                {/* Sticky Columns Header */}
                <th 
                  className="sticky left-0 bg-white z-20 px-4 py-3 border-b text-center"
                  style={{ minWidth: '80px' }}
                >
                  Tahun
                </th>
                <th 
                  className="sticky left-[70px] md:left-[80px] bg-white z-20 px-4 py-3 border-b"
                  style={{ minWidth: '140px' }}
                >
                  Kapanewon
                </th>
                <th 
                  className="sticky left-[170px] md:left-[200px] bg-white z-20 px-4 py-3 border-b"
                  style={{ minWidth: '140px' }}
                >
                  Kalurahan
                </th>

                {/* Category Headers */}
                {selectedKategori === 'semua' ? (
                  categories.map(cat => (
                    <th 
                      key={cat}
                      className="px-4 py-4 text-right hover:bg-slate-100 transition-colors cursor-help"
                      title={CATEGORY_MAP[cat]}
                    >
                      {cat.toUpperCase()}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-4 text-right text-blue-800 bg-blue-50/50">
                    {PPKS_CATEGORIES.find(c => c.id === selectedKategori)?.label}
                  </th>
                )}
                
                {/* Aksi Header Sticky Right */}
                <th className="px-4 py-4 text-center sticky right-0 z-20 bg-white border-l border-b border-slate-200 min-w-[100px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/50 group">
                  {/* Sticky Columns Body */}
                  <td 
                    className="sticky left-0 bg-white z-10 px-4 py-3 border-b text-center tabular-nums font-medium text-slate-900"
                    style={{ minWidth: '80px' }}
                  >
                    {row.tahun}
                  </td>
                  <td 
                    className="sticky left-[70px] md:left-[80px] bg-white z-10 px-4 py-3 border-b font-medium text-slate-900"
                    style={{ minWidth: '140px' }}
                  >
                    {row.kapanewon}
                  </td>
                  <td 
                    className="sticky left-[170px] md:left-[200px] bg-white z-10 px-4 py-3 border-b text-slate-700"
                    style={{ minWidth: '140px' }}
                  >
                    {row.kalurahan}
                  </td>

                  {/* Category Cells */}
                  {selectedKategori === 'semua' ? (
                    categories.map(cat => (
                      <td key={cat} className="px-4 py-3 text-right tabular-nums">
                        {row[cat] > 0 ? (
                          <span className="font-medium text-slate-700">{row[cat].toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    ))
                  ) : (
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-blue-700 bg-blue-50/30">
                      {row[selectedKategori as keyof typeof CATEGORY_MAP] > 0 ? (
                        row[selectedKategori as keyof typeof CATEGORY_MAP].toLocaleString('id-ID')
                      ) : (
                        <span className="text-blue-300">-</span>
                      )}
                    </td>
                  )}
                  
                  {/* Aksi Column Sticky Right */}
                  <td className="px-4 py-3 text-center sticky right-0 z-10 bg-white border-l border-b border-slate-200 min-w-[100px]">
                    <button 
                      onClick={() => row.id ? handleDelete(row.id) : null} 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* No Data State */}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={(selectedKategori === 'semua' ? categories.length : 1) + 4} className="px-4 py-12 text-center text-slate-500">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="sticky left-0 bg-slate-50 z-10 px-4 py-3 border-r border-slate-200" colSpan={3}>
                    TOTAL KESELURUHAN
                  </td>
                  {selectedKategori === 'semua' ? (
                    PPKS_CATEGORIES.map(cat => (
                      <td key={cat.id} className="px-4 py-3 text-right text-slate-800 tabular-nums">
                        {(Number(summaryStats.categoryTotals[cat.id]) || 0).toLocaleString('id-ID')}
                      </td>
                    ))
                  ) : (
                    <td className="px-4 py-3 text-right text-slate-800 bg-blue-100/50 tabular-nums">
                      {(Number(summaryStats.categoryTotals[selectedKategori]) || 0).toLocaleString('id-ID')}
                    </td>
                  )}
                  <td className="sticky right-0 bg-slate-50 z-10 px-4 py-3 border-l border-slate-200"></td>
                </tr>
              </tfoot>
            )}
          </table>
      </div>

      <div className="mt-4 text-sm text-slate-500 flex justify-between items-center px-1">
        <p>Menampilkan <span className="font-medium text-slate-700">{filteredData.length}</span> baris data kewilayahan.</p>
      </div>

      {/* Add Data Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Tambah Data PPKS Manual</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveData} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 md:p-6 overflow-y-auto space-y-8 flex-1">
                
                {/* Wilayah Section */}
                <section>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <MapPin size={18} className="text-blue-500" /> Wilayah
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kapanewon</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Contoh: Gedangsari"
                        value={formData.kapanewon} 
                        onChange={e => setFormData({...formData, kapanewon: e.target.value})} 
                        className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kalurahan</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Contoh: Hargomulyo"
                        value={formData.kalurahan} 
                        onChange={e => setFormData({...formData, kalurahan: e.target.value})} 
                        className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="Contoh: 2024"
                        value={formData.tahun} 
                        onChange={e => setFormData({...formData, tahun: parseInt(e.target.value) || new Date().getFullYear()})} 
                        className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all tabular-nums" 
                      />
                    </div>
                  </div>
                </section>

                {/* Rincian Kategori PPKS */}
                <section>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Users size={18} className="text-red-500" /> Rincian Kategori PPKS
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map(cat => (
                      <div key={cat} className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider flex items-center justify-between" title={CATEGORY_MAP[cat]}>
                          {cat}
                        </label>
                        <input 
                          type="number" 
                          required 
                          min="0"
                          value={(formData as any)[cat]} 
                          onChange={e => handleNumberChange(cat, e.target.value)} 
                          className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all tabular-nums" 
                        />
                      </div>
                    ))}
                  </div>
                </section>

              </div>
              
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
                >
                  <Save size={16} />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Import CSV Data PPKS</h2>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSelectedFile(null);
                }} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 md:p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">Format Kolom CSV yang didukung:</p>
                <code className="text-blue-700 block mb-3 font-mono break-words bg-blue-100/50 p-2 rounded">tahun, kapanewon, kalurahan, adk, pd, abt, aj, aktk, at, bwblp, gel, kbsp, kpn, ktk, lut, pem, peng, pmbs, prse</code>
                <p className="text-blue-800 mb-3">Pastikan format file sesuai dengan template.</p>
                <button onClick={handleDownloadTemplate} className="text-blue-600 font-semibold flex items-center gap-2 hover:text-blue-800">
                  <Download size={16}/> Unduh Template CSV
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih File CSV</label>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 border border-slate-200 rounded-md cursor-pointer" 
                />
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
              <button 
                type="button" 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSelectedFile(null);
                }} 
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handleConfirmImport}
                disabled={!selectedFile || isUploading} 
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
              >
                <Upload size={16} />
                <span>{isUploading ? 'Mengimport...' : 'Mulai Import'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
