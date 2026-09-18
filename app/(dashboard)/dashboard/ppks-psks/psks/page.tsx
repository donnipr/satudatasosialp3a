'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Loader2, X, Users, RefreshCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PSKSRow {
  id: string;
  jenis_psks: string;
  total: number;
  satuan: string;
  created_at?: string;
}

export default function DataPSKSPage() {
  const supabase = createClient();
  const [data, setData] = useState<PSKSRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [jenisPsks, setJenisPsks] = useState('');
  const [total, setTotal] = useState<number | ''>('');
  const [satuan, setSatuan] = useState('Orang');

  const fetchPSKSData = async () => {
    setIsLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from('data_psks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching PSKS:', error);
        alert('Gagal memuat data dari database.');
      } else if (fetchedData) {
        setData(fetchedData as PSKSRow[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPSKSData();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setJenisPsks('');
    setTotal('');
    setSatuan('Orang');
    setIsModalOpen(true);
  };

  const openEditModal = (row: PSKSRow) => {
    setEditId(row.id);
    setJenisPsks(row.jenis_psks);
    setTotal(row.total);
    setSatuan(row.satuan || 'Orang');
    setIsModalOpen(true);
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total === '' || total < 0) {
      alert('Total tidak valid!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        jenis_psks: jenisPsks,
        total: Number(total),
        satuan: satuan
      };

      if (editId) {
        // Update
        const { error } = await supabase
          .from('data_psks')
          .update(payload)
          .eq('id', editId);
          
        if (error) throw error;
        alert('Data berhasil diperbarui');
      } else {
        // Insert
        const { error } = await supabase
          .from('data_psks')
          .insert([payload]);
          
        if (error) throw error;
        alert('Data berhasil ditambahkan');
      }

      fetchPSKSData();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      const { error } = await supabase
        .from('data_psks')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      alert('Data berhasil dihapus');
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete exception:', err);
      alert('Gagal menghapus data');
    }
  };

  const grandTotal = useMemo(() => {
    return data.reduce((acc, row) => acc + (Number(row.total) || 0), 0);
  }, [data]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-24 relative">
      {/* Header & Unified Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Data PSKS</h1>
          <p className="text-gray-500 mt-1 text-sm">Potensi dan Sumber Kesejahteraan Sosial</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={fetchPSKSData}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <RefreshCcw size={16} />
            Muat Ulang
          </button>
          <button 
            onClick={openAddModal} 
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <Plus size={16} />
            Tambah Data
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-500 font-medium">Total Keseluruhan PSKS</p>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Users size={20}/>
          </div>
        </div>
        <h3 className="text-3xl font-bold text-slate-800">
          {isLoading ? '-' : grandTotal.toLocaleString('id-ID')} 
          <span className="text-sm font-medium text-slate-500 ml-1"></span>
        </h3>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-auto max-h-[70vh] bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full min-w-max text-sm text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 border-b shadow-[0_1px_0_0_#e2e8f0] text-center w-16">
                NO
              </th>
              <th className="px-4 py-4 border-b shadow-[0_1px_0_0_#e2e8f0]">
                JENIS PSKS
              </th>
              <th className="px-4 py-4 border-b shadow-[0_1px_0_0_#e2e8f0] text-right w-48">
                TOTAL
              </th>
              <th className="px-4 py-4 border-b shadow-[0_1px_0_0_#e2e8f0] text-center w-32">
                SATUAN
              </th>
              <th className="px-4 py-4 text-center border-l border-b border-slate-200 w-32 shadow-[0_1px_0_0_#e2e8f0]">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id} className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/50">
                  <td className="px-4 py-3 text-center tabular-nums text-slate-900 border-b">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 border-b">
                    {row.jenis_psks}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums border-b font-medium">
                    {row.total.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums border-b font-medium">
                    {row.satuan}
                  </td>
                  <td className="px-4 py-3 text-center bg-white border-l border-b border-slate-200">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(row)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors" 
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(row.id)} 
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors" 
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && data.length > 0 && (
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
              <tr>
                <td className="px-4 py-3 border-r border-slate-200 text-center" colSpan={2}>
                  GRAND TOTAL
                </td>
                <td className="px-4 py-3 text-right text-slate-800 tabular-nums">
                  {grandTotal.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 border-r border-slate-200" colSpan={1}></td>
                <td className="px-4 py-3 border-l border-slate-200"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? 'Edit Data PSKS' : 'Tambah Data PSKS'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveData} className="p-5 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis PSKS
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan Jenis PSKS"
                  value={jenisPsks}
                  onChange={(e) => setJenisPsks(e.target.value)}
                  className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  placeholder="Masukkan jumlah"
                  value={total} 
                  onChange={e => setTotal(e.target.value ? parseInt(e.target.value) : '')} 
                  className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all tabular-nums" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satuan
                </label>
                <select
                  required
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="Orang">Orang</option>
                  <option value="Lembaga">Lembaga</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
