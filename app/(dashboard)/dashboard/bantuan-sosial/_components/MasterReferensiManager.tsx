'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Pencil, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  'TAHUN', 
  'PERIODE', 
  'PROGRAM', 
  'SUMBER_ANGGARAN', 
  'BENTUK_INTERVENSI', 
  'SASARAN'
]

export default function MasterReferensiManager() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [newValue, setNewValue] = useState("")
  const [referenceData, setReferenceData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const supabase = createClient()

  const fetchReferenceData = async () => {
    setIsLoading(true)
    setError('')
    
    const { data, error } = await supabase
      .from('master_referensi')
      .select('*')
      .eq('kategori', activeCategory)
      .order('nilai', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setReferenceData(data || [])
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    fetchReferenceData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newValue.trim()) return

    setIsSubmitting(true)
    setError('')

    const { error } = await supabase
      .from('master_referensi')
      .insert([{ kategori: activeCategory, nilai: newValue.trim() }])

    setIsSubmitting(false)

    if (error) {
      setError(error.message)
    } else {
      setNewValue('')
      fetchReferenceData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus referensi ini?')) return

    setError('')
    const { error } = await supabase
      .from('master_referensi')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      fetchReferenceData()
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) return;
    
    const { error } = await supabase
      .from('master_referensi')
      .update({ nilai: editValue })
      .eq('id', id);
      
    if (error) {
      setError(error.message);
    } else {
      setEditingId(null);
      setEditValue('');
      fetchReferenceData();
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-4">
      
      {/* LEFT COLUMN: Categories Sidebar */}
      <div className="w-full md:w-1/4 flex flex-col gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-3 h-fit">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3 pt-2">Kategori Master</h3>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-red-50 text-red-600 border-r-4 border-red-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* RIGHT COLUMN: Data Management */}
      <div className="w-full md:w-3/4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Header & Form */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Kelola Referensi: <span className="text-red-600">{activeCategory}</span>
          </h2>
          
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Masukkan nilai referensi baru..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newValue.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tambah
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-red-600" size={32} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nilai Referensi</th>
                  <th className="px-6 py-3 font-semibold text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {referenceData.length > 0 ? (
                  referenceData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-gray-900 font-medium">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            autoFocus
                          />
                        ) : (
                          item.nilai
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {editingId === item.id ? (
                            <>
                              <button 
                                onClick={() => handleUpdate(item.id)} 
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                title="Simpan"
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)} 
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" 
                                title="Batal"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditValue(item.nilai);
                                }} 
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Edit"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-gray-400">
                      Belum ada data referensi untuk kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
    </div>
  )
}
