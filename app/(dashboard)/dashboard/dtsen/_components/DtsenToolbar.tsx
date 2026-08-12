'use client'

import { useState, useRef } from 'react'
import { Plus, Download, Upload, X, Save, FileUp } from 'lucide-react'
import { createRekapDtsen, importCsvDtsen } from '@/app/actions/dtsen'

export function DtsenToolbar({ role, data }: { role: string, data: any[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const initialFormState = {
    periode: 'Triwulan 1',
    tahun: new Date().getFullYear(),
    kecamatan: '',
    kelurahan: '',
    total_keluarga: 0,
    total_individu: 0,
    d1_keluarga: 0, d1_individu: 0,
    d2_keluarga: 0, d2_individu: 0,
    d3_keluarga: 0, d3_individu: 0,
    d4_keluarga: 0, d4_individu: 0,
    d5_keluarga: 0, d5_individu: 0,
    d6_10_keluarga: 0, d6_10_individu: 0,
    belum_peringkat_keluarga: 0, belum_peringkat_individu: 0,
    nonaktif_keluarga: 0, nonaktif_individu: 0,
  }

  const [formData, setFormData] = useState(initialFormState)

  const [importParams, setImportParams] = useState({
    tahun: new Date().getFullYear(),
    periode: 'Triwulan 1'
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    if (!data || data.length === 0) return alert('Tidak ada data untuk diekspor')
    
    const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'created_at')
    const rows = data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    const csvContent = [headers.join(','), ...rows].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'rekap_dtsen.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return alert('Pilih file CSV terlebih dahulu')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length < 2) return alert('File CSV kosong atau tidak valid')
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const parsedData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const rowData: any = {}
          headers.forEach((h, i) => {
            const val = values[i]
            if (h === 'tahun' || h === 'periode') return
            
            if (['total_keluarga', 'total_individu'].includes(h) || h.includes('_keluarga') || h.includes('_individu')) {
              rowData[h] = parseInt(val) || 0
            } else {
              rowData[h] = val
            }
          })
          
          rowData.tahun = importParams.tahun
          rowData.periode = importParams.periode
          return rowData
        })

        setIsLoading(true)
        await importCsvDtsen(parsedData)
        alert('Impor CSV berhasil!')
        setIsImportModalOpen(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (err: any) {
        alert('Gagal mengimpor CSV: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await createRekapDtsen(formData)
      setIsAddModalOpen(false)
      setFormData(initialFormState)
    } catch (err: any) {
      alert('Gagal menambah data: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // if (role !== 'superuser') {
  //   return null
  // }

  const handleNumberChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: parseInt(value) || 0 })
  }

  return (
    <div className="flex gap-2">
      {role === 'IAM & ADMIN' && (
        <>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Tambah Data</span>
          </button>

          <button 
            onClick={() => setIsImportModalOpen(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Upload size={16} />
            <span>Import CSV</span>
          </button>
        </>
      )}

      <button 
        onClick={handleExport}
        className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
      >
        <Download size={16} />
        <span>Export CSV</span>
      </button>

      {/* Modal Tambah Data */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl my-auto flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Tambah Data Rekap DTSEN</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                
                {/* Informasi Dasar */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Informasi Dasar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                      <select required value={formData.periode} onChange={e => setFormData({...formData, periode: e.target.value})} className="w-full border-gray-200 rounded-lg p-2 border bg-white">
                        <option value="Triwulan 1">Triwulan 1</option>
                        <option value="Triwulan 2">Triwulan 2</option>
                        <option value="Triwulan 3">Triwulan 3</option>
                        <option value="Triwulan 4">Triwulan 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                      <input type="number" required value={formData.tahun} onChange={e => handleNumberChange('tahun', e.target.value)} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kapanewon</label>
                      <input type="text" required value={formData.kecamatan} onChange={e => setFormData({...formData, kecamatan: e.target.value})} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kalurahan</label>
                      <input type="text" required value={formData.kelurahan} onChange={e => setFormData({...formData, kelurahan: e.target.value})} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Keluarga</label>
                      <input type="number" required value={formData.total_keluarga} onChange={e => handleNumberChange('total_keluarga', e.target.value)} className="w-full border-gray-200 rounded-lg p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Individu</label>
                      <input type="number" required value={formData.total_individu} onChange={e => handleNumberChange('total_individu', e.target.value)} className="w-full border-gray-200 rounded-lg p-2 border" />
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
                          <input type="number" required value={(formData as any)[item.field]} onChange={e => handleNumberChange(item.field, e.target.value)} className="w-1/2 border-gray-200 rounded-lg p-1.5 border text-sm" />
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
                          <input type="number" required value={(formData as any)[item.field]} onChange={e => handleNumberChange(item.field, e.target.value)} className="w-1/2 border-gray-200 rounded-lg p-1.5 border text-sm" />
                        </div>
                      ))}
                    </div>

                  </div>
                </section>

              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 flex-shrink-0 rounded-b-xl">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-white bg-transparent transition-colors">Batal</button>
                <button type="submit" disabled={isLoading} className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm">
                  <Save size={16} />
                  <span>{isLoading ? 'Menyimpan...' : 'Simpan Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV remains mostly unchanged */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Import CSV Rekap DTSEN</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleImportSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4 border border-blue-100">
                <p>Parameter Tahun dan Periode di bawah ini akan disuntikkan secara otomatis ke setiap baris data CSV Anda.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Target</label>
                  <input 
                    type="number" 
                    required 
                    value={importParams.tahun} 
                    onChange={e => setImportParams({...importParams, tahun: parseInt(e.target.value)})} 
                    className="w-full border-gray-200 rounded-lg p-2 border" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode Target</label>
                  <select 
                    required 
                    value={importParams.periode} 
                    onChange={e => setImportParams({...importParams, periode: e.target.value})} 
                    className="w-full border-gray-200 rounded-lg p-2 border bg-white"
                  >
                    <option value="Triwulan 1">Triwulan 1</option>
                    <option value="Triwulan 2">Triwulan 2</option>
                    <option value="Triwulan 3">Triwulan 3</option>
                    <option value="Triwulan 4">Triwulan 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih File CSV</label>
                <input 
                  type="file" 
                  accept=".csv" 
                  required
                  ref={fileInputRef}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer border border-gray-200 rounded-lg p-1"
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 mt-6 pt-4">
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isLoading} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  <FileUp size={16} />
                  <span>{isLoading ? 'Mengimpor...' : 'Mulai Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
