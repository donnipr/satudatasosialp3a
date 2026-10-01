'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Upload, Edit, Trash2, X, Download } from 'lucide-react';
import Papa from 'papaparse';

interface RekapPendaftaran {
  id: number;
  kapanewon: string;
  kalurahan: string;
  jumlah_keluarga: number;
  desil_1_5: number;
  penerima_pkh: number;
  penerima_bpnt: number;
  total_pendaftar: number;
  periode_dtsen: string;
  tahun: string | number;
}

export default function RekapPendaftaranPage() {
  const [data, setData] = useState<RekapPendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    kapanewon: '',
    kalurahan: '',
    penerima_pkh: 0,
    penerima_bpnt: 0,
    total_pendaftar: 0,
  });
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_perlinsos_dtsen')
        .select('*')
        .order('kapanewon', { ascending: true })
        .order('kalurahan', { ascending: true });

      if (error) {
        throw error;
      }

      setData(data || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      kapanewon: formData.kapanewon,
      kalurahan: formData.kalurahan,
      penerima_pkh: Number(formData.penerima_pkh),
      penerima_bpnt: Number(formData.penerima_bpnt),
      total_pendaftar: Number(formData.total_pendaftar),
    };

    try {
      if (editId) {
        const { error } = await supabase
          .from('rekap_pendaftaran_perlinsos')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rekap_pendaftaran_perlinsos')
          .insert(payload);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rekap_pendaftaran_perlinsos')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      kapanewon: '',
      kalurahan: '',
      penerima_pkh: 0,
      penerima_bpnt: 0,
      total_pendaftar: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: RekapPendaftaran) => {
    setEditId(row.id);
    setFormData({
      kapanewon: row.kapanewon,
      kalurahan: row.kalurahan,
      penerima_pkh: row.penerima_pkh,
      penerima_bpnt: row.penerima_bpnt,
      total_pendaftar: row.total_pendaftar,
    });
    setIsModalOpen(true);
  };

  const downloadTemplate = () => {
    const headers = "kapanewon,kalurahan,penerima_pkh,penerima_bpnt,total_pendaftar\n";
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
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
          const formattedData = results.data.map((row: any) => ({
            kapanewon: row.kapanewon,
            kalurahan: row.kalurahan,
            penerima_pkh: Number(row.penerima_pkh || 0),
            penerima_bpnt: Number(row.penerima_bpnt || 0),
            total_pendaftar: Number(row.total_pendaftar || 0),
          }));

          const { error } = await supabase
            .from('rekap_pendaftaran_perlinsos')
            .upsert(formattedData, {
              onConflict: 'kapanewon,kalurahan',
              ignoreDuplicates: false
            });
            
          if (error) throw error;
          
          alert('Data berhasil diimport');
          fetchData();
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

  const totalSum = data.reduce(
    (acc, curr) => {
      acc.jumlah_keluarga += Number(curr.jumlah_keluarga || 0);
      acc.desil_1_5 += Number(curr.desil_1_5 || 0);
      acc.penerima_pkh += Number(curr.penerima_pkh || 0);
      acc.penerima_bpnt += Number(curr.penerima_bpnt || 0);
      acc.total_pendaftar += Number(curr.total_pendaftar || 0);
      return acc;
    },
    {
      jumlah_keluarga: 0,
      desil_1_5: 0,
      penerima_pkh: 0,
      penerima_bpnt: 0,
      total_pendaftar: 0,
    }
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Rekap Pendaftaran Perlinsos Digital</h1>
          <p className="text-sm text-gray-500">
            Data rekapitulasi pendaftaran perlindungan sosial berdasarkan kapanewon dan kalurahan.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
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

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-0">
          {loading && data.length === 0 ? (
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
                    <th className="px-6 py-4 font-semibold uppercase">KAPANEWON</th>
                    <th className="px-6 py-4 font-semibold uppercase">KALURAHAN</th>
                    <th className="px-6 py-4 font-semibold text-right">JUMLAH KELUARGA</th>
                    <th className="px-6 py-4 font-semibold text-right">DESIL 1-5</th>
                    <th className="px-6 py-4 font-semibold text-right">PENERIMA PKH</th>
                    <th className="px-6 py-4 font-semibold text-right">PENERIMA BPNT</th>
                    <th className="px-6 py-4 font-semibold text-right">TOTAL PENDAFTAR</th>
                    <th className="px-6 py-4 font-semibold uppercase">PERIODE DTSEN</th>
                    <th className="px-6 py-4 font-semibold uppercase">TAHUN</th>
                    <th className="px-6 py-4 font-semibold text-center uppercase">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada data ditemukan
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{row.kapanewon}</td>
                        <td className="px-6 py-4">{row.kalurahan}</td>
                        <td className="px-6 py-4 text-right tabular-nums">{Number(row.jumlah_keluarga || 0).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-right tabular-nums">{Number(row.desil_1_5 || 0).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-right tabular-nums">{Number(row.penerima_pkh || 0).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-right tabular-nums">{Number(row.penerima_bpnt || 0).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-right tabular-nums">{Number(row.total_pendaftar || 0).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4">{row.periode_dtsen}</td>
                        <td className="px-6 py-4">{row.tahun}</td>
                        <td className="px-6 py-4 text-center">
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
                    ))
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-right uppercase">TOTAL KESELURUHAN</td>
                      <td className="px-6 py-4 text-right tabular-nums text-red-600">{totalSum.jumlah_keluarga.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-red-600">{totalSum.desil_1_5.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-red-600">{totalSum.penerima_pkh.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-red-600">{totalSum.penerima_bpnt.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-red-600">{totalSum.total_pendaftar.toLocaleString('id-ID')}</td>
                      <td colSpan={3}></td>
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penerima PKH</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.penerima_pkh}
                    onChange={(e) => setFormData({ ...formData, penerima_pkh: parseInt(e.target.value) || 0 })}
                    className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penerima BPNT</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.penerima_bpnt}
                    onChange={(e) => setFormData({ ...formData, penerima_bpnt: parseInt(e.target.value) || 0 })}
                    className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Pendaftar</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.total_pendaftar}
                    onChange={(e) => setFormData({ ...formData, total_pendaftar: parseInt(e.target.value) || 0 })}
                    className="w-full border-gray-200 rounded-lg p-2 border focus:ring-red-500 focus:border-red-500"
                  />
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
                  disabled={loading}
                  className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
