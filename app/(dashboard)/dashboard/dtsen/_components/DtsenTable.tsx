'use client'

import { useState } from 'react'
import { Edit2, Trash2, X, Save } from 'lucide-react'
import { updateRekapDtsen, deleteRekapDtsen } from '@/app/actions/dtsen'

export function DtsenTable({ data, role }: { data: any[], role: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  // RBAC control
  const isSuperuser = role === 'IAM & ADMIN'

  const handleEditClick = (row: any) => {
    setEditingId(row.id)
    setEditForm({ ...row })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    setIsLoading(true)
    try {
      await deleteRekapDtsen(id)
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateRekapDtsen(editingId!, editForm)
      setEditingId(null)
    } catch (err: any) {
      alert('Gagal mengubah data: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNumberChange = (field: string, value: string) => {
    setEditForm({ ...editForm, [field]: parseInt(value) || 0 })
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
          <table className="w-full text-sm text-left border-collapse relative">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 font-semibold align-middle whitespace-nowrap">Periode</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 font-semibold align-middle whitespace-nowrap">Tahun</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 font-semibold align-middle whitespace-nowrap">Kapanewon</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 font-semibold align-middle whitespace-nowrap">Kalurahan</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center bg-gray-100">Total</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center">Desil 1</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center">Desil 2</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center">Desil 3</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center">Desil 4</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center">Desil 5</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center">Desil 6-10</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center">Belum Peringkat</th>
                <th colSpan={2} className="px-4 py-2 border-r border-gray-200 border-b font-semibold text-center bg-red-50 text-red-700">Non Aktif</th>
                {isSuperuser && (
                  <th rowSpan={2} className="px-4 py-3 font-semibold align-middle whitespace-nowrap text-center bg-gray-100">Aksi</th>
                )}
              </tr>
              <tr className="bg-gray-50 text-gray-600 text-[11px]">
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium bg-gray-100">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium bg-gray-100">Individu</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Individu</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Individu</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Individu</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Individu</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Individu</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium">Individu</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium bg-red-50">Keluarga</th>
                <th className="px-3 py-2 border-r border-gray-200 text-center font-medium bg-red-50">Individu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={23} className="px-4 py-12 text-center text-gray-500 bg-gray-50/50">
                    Tidak ada data rekap ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 border-r border-gray-100 text-gray-600 whitespace-nowrap text-center">{row.periode}</td>
                    <td className="px-4 py-3 border-r border-gray-100 text-gray-600 whitespace-nowrap text-center">{row.tahun}</td>
                    <td className="px-4 py-3 border-r border-gray-100 font-medium text-gray-900 whitespace-nowrap">{row.kecamatan}</td>
                    <td className="px-4 py-3 border-r border-gray-200 whitespace-nowrap">{row.kelurahan}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center font-semibold bg-gray-50/50">{row.total_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center font-semibold bg-gray-50/50">{row.total_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-600">{row.d1_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-600">{row.d1_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-600">{row.d2_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-600">{row.d2_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-600">{row.d3_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-600">{row.d3_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-600">{row.d4_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-600">{row.d4_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-600">{row.d5_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-600">{row.d5_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-600">{row.d6_10_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-600">{row.d6_10_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-600">{row.belum_peringkat_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-gray-600">{row.belum_peringkat_individu?.toLocaleString('id-ID')}</td>
                    
                    <td className="px-3 py-3 border-r border-red-50 text-center text-red-600 font-medium bg-red-50/30">{row.nonaktif_keluarga?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 border-r border-gray-200 text-center text-red-600 font-medium bg-red-50/30">{row.nonaktif_individu?.toLocaleString('id-ID')}</td>
                    
                    {isSuperuser && (
                      <td className="px-4 py-3 text-center bg-gray-50/30">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => handleEditClick(row)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(row.id)} disabled={isLoading} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50" title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Data */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl my-auto flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Edit Data Rekap DTSEN</h2>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                
                {/* Informasi Dasar */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Informasi Dasar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                      <select required value={editForm.periode} onChange={e => setEditForm({...editForm, periode: e.target.value})} className="w-full border-gray-200 rounded-lg p-2 border bg-white">
                        <option value="Triwulan 1">Triwulan 1</option>
                        <option value="Triwulan 2">Triwulan 2</option>
                        <option value="Triwulan 3">Triwulan 3</option>
                        <option value="Triwulan 4">Triwulan 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                      <input type="number" required value={editForm.tahun} onChange={e => handleNumberChange('tahun', e.target.value)} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kapanewon</label>
                      <input type="text" required value={editForm.kecamatan} onChange={e => setEditForm({...editForm, kecamatan: e.target.value})} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kalurahan</label>
                      <input type="text" required value={editForm.kelurahan} onChange={e => setEditForm({...editForm, kelurahan: e.target.value})} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Keluarga</label>
                      <input type="number" required value={editForm.total_keluarga} onChange={e => handleNumberChange('total_keluarga', e.target.value)} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Individu</label>
                      <input type="number" required value={editForm.total_individu} onChange={e => handleNumberChange('total_individu', e.target.value)} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                  </div>
                </section>

                {/* Rincian Data */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Rincian Desil & Peringkat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Keluarga Column */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-md text-center">Data Keluarga</h4>
                      {[
                        { label: 'Desil 1', field: 'd1_keluarga' },
                        { label: 'Desil 2', field: 'd2_keluarga' },
                        { label: 'Desil 3', field: 'd3_keluarga' },
                        { label: 'Desil 4', field: 'd4_keluarga' },
                        { label: 'Desil 5', field: 'd5_keluarga' },
                        { label: 'Desil 6-10', field: 'd6_10_keluarga' },
                        { label: 'Belum Peringkat', field: 'belum_peringkat_keluarga' },
                        { label: 'Non Aktif', field: 'nonaktif_keluarga' },
                      ].map(item => (
                        <div key={item.field} className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">{item.label}</label>
                          <input type="number" required value={(editForm as any)[item.field]} onChange={e => handleNumberChange(item.field, e.target.value)} className="w-1/2 border-gray-200 rounded-lg p-1.5 border text-sm" />
                        </div>
                      ))}
                    </div>

                    {/* Individu Column */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-md text-center">Data Individu</h4>
                      {[
                        { label: 'Desil 1', field: 'd1_individu' },
                        { label: 'Desil 2', field: 'd2_individu' },
                        { label: 'Desil 3', field: 'd3_individu' },
                        { label: 'Desil 4', field: 'd4_individu' },
                        { label: 'Desil 5', field: 'd5_individu' },
                        { label: 'Desil 6-10', field: 'd6_10_individu' },
                        { label: 'Belum Peringkat', field: 'belum_peringkat_individu' },
                        { label: 'Non Aktif', field: 'nonaktif_individu' },
                      ].map(item => (
                        <div key={item.field} className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">{item.label}</label>
                          <input type="number" required value={(editForm as any)[item.field]} onChange={e => handleNumberChange(item.field, e.target.value)} className="w-1/2 border-gray-200 rounded-lg p-1.5 border text-sm" />
                        </div>
                      ))}
                    </div>

                  </div>
                </section>

              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 flex-shrink-0 rounded-b-xl">
                <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-white bg-transparent transition-colors">Batal</button>
                <button type="submit" disabled={isLoading} className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm">
                  <Save size={16} />
                  <span>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
