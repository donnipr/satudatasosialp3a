'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Upload, Edit, Trash2, X, Download } from 'lucide-react';
import Papa from 'papaparse';

interface RekapAgen {
  id: string;
  kapanewon: string;
  kalurahan: string;
  jumlah_keluarga: number;
  desil_1_5: number;
  agen: number;
  agen_aktif: number;
  periode_dtsen: string;
  tahun: number;
}

export default function RekapAgenPage() {
  const [data, setData] = useState<RekapAgen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    kapanewon: '',
    kalurahan: '',
    agen: 0,
    agen_aktif: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error: fetchError } = await supabase
        .from('view_perlinsos_agen_dtsen')
        .select('*')
        .order('kapanewon', { ascending: true })
        .order('kalurahan', { ascending: true });

      if (fetchError) throw fetchError;
      setData(result || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'kapanewon' || name === 'kalurahan' ? value : Number(value),
    }));
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      kapanewon: '',
      kalurahan: '',
      agen: 0,
      agen_aktif: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: RekapAgen) => {
    setEditId(row.id);
    setFormData({
      kapanewon: row.kapanewon,
      kalurahan: row.kalurahan,
      agen: row.agen || 0,
      agen_aktif: row.agen_aktif || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editId) {
        // Update
        const { error } = await supabase
          .from('rekap_agen_perlinsos')
          .update(formData)
          .eq('id', editId);
          
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('rekap_agen_perlinsos')
          .insert(formData);
          
        if (error) throw error;
      }
      
      closeModal();
      fetchData(); // Refresh table
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      const { error } = await supabase
        .from('rekap_agen_perlinsos')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  const downloadTemplate = () => {
    const headers = "kapanewon,kalurahan,agen,agen_aktif\n";
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_agen_perlinsos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData = results.data as any[];
          
          // Map to correct format, converting strings to numbers
          const formattedData = parsedData.map(item => ({
            kapanewon: item.kapanewon,
            kalurahan: item.kalurahan,
            agen: Number(item.agen || 0),
            agen_aktif: Number(item.agen_aktif || 0)
          }));

          const { error } = await supabase
            .from('rekap_agen_perlinsos')
            .upsert(formattedData, {
              onConflict: 'kapanewon,kalurahan',
              ignoreDuplicates: false
            });
            
          if (error) throw error;
          
          alert('Berhasil mengimpor data!');
          fetchData();
        } catch (err: any) {
          console.error(err);
          alert('Gagal mengimpor CSV: ' + err.message);
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        alert('Gagal membaca file CSV: ' + error.message);
      }
    });
  };

  // Calculate Totals for Footer
  const totalKeluarga = data.reduce((sum, item) => sum + Number(item.jumlah_keluarga || 0), 0);
  const totalRentan = data.reduce((sum, item) => sum + Number(item.desil_1_5 || 0), 0);
  const totalAgen = data.reduce((sum, item) => sum + Number(item.agen || 0), 0);
  const totalAgenAktif = data.reduce((sum, item) => sum + Number(item.agen_aktif || 0), 0);

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rekap Agen Perlinsos Digital</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data agen dari program Perlinsos Digital</p>
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
          
          <div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Kapanewon</th>
                <th className="px-4 py-3 font-semibold">Kalurahan</th>
                <th className="px-4 py-3 font-semibold text-right">Jumlah Keluarga</th>
                <th className="px-4 py-3 font-semibold text-right">Desil 1-5</th>
                <th className="px-4 py-3 font-semibold text-right">Agen</th>
                <th className="px-4 py-3 font-semibold text-right">Agen Aktif</th>
                <th className="px-4 py-3 font-semibold text-center">Periode DTSEN</th>
                <th className="px-4 py-3 font-semibold text-center">Tahun</th>
                <th className="px-4 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.kapanewon}</td>
                    <td className="px-4 py-3 text-slate-600">{item.kalurahan}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(item.jumlah_keluarga || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(item.desil_1_5 || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">{Number(item.agen || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-600 font-medium">{Number(item.agen_aktif || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{item.periode_dtsen}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{item.tahun}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
            {!loading && data.length > 0 && (
              <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">TOTAL</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalKeluarga.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalRentan.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{totalAgen.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-blue-600">{totalAgenAktif.toLocaleString('id-ID')}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editId ? 'Edit Data Agen' : 'Tambah Data Agen'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kapanewon</label>
                <input
                  type="text"
                  name="kapanewon"
                  value={formData.kapanewon}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kalurahan</label>
                <input
                  type="text"
                  name="kalurahan"
                  value={formData.kalurahan}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agen</label>
                  <input
                    type="number"
                    name="agen"
                    value={formData.agen}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agen Aktif</label>
                  <input
                    type="number"
                    name="agen_aktif"
                    value={formData.agen_aktif}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
