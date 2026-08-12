'use client'

import React, { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Database, Settings, Upload, FileUp, X, Download, BarChart2, ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react'
import BantuanSosialForm from './BantuanSosialForm'
import MasterReferensiManager from './MasterReferensiManager'
import PivotTableBantuan from './PivotTableBantuan'
import { importCsvBantuanSosial } from '@/app/actions/bantuanSosial'

export default function BantuanSosialClient({ 
  role, 
  masterData, 
  initialData 
}: { 
  role: string, 
  masterData: any[], 
  initialData: any[] 
}) {
  const [data, setData] = useState(initialData)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const canEdit = role === 'IAM & ADMIN'

  const filteredData = data.filter(item => 
    (item.kapanewon?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (item.kalurahan?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (item.nama_program?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
  )

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, {
      key: string;
      tahun: number;
      periode: string;
      nama_program: string;
      sumber_anggaran: string;
      bentuk_intervensi: string;
      sasaran_intervensi: string;
      total_jumlah: number;
      children: any[];
    }> = {};

    filteredData.forEach(item => {
      const key = `${item.tahun}_${item.periode}_${item.nama_program}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          tahun: item.tahun,
          periode: item.periode,
          nama_program: item.nama_program,
          sumber_anggaran: item.sumber_anggaran,
          bentuk_intervensi: item.bentuk_intervensi,
          sasaran_intervensi: item.sasaran_intervensi,
          total_jumlah: 0,
          children: []
        };
      }
      groups[key].total_jumlah += (parseInt(item.jumlah) || 0);
      groups[key].children.push(item);
    });
    
    return Object.values(groups).sort((a, b) => {
      if (a.tahun !== b.tahun) return b.tahun - a.tahun;
      if (a.periode !== b.periode) return a.periode.localeCompare(b.periode);
      return a.nama_program.localeCompare(b.nama_program);
    });
  }, [filteredData]);

  const handleSuccess = (newRecord: any) => {
    setData([newRecord, ...data])
    setIsFormOpen(false)
  }

  const handleDownloadTemplate = () => {
    const headers = [
      "tahun", 
      "periode", 
      "kapanewon", 
      "kalurahan", 
      "nama_program", 
      "sumber_anggaran", 
      "bentuk_intervensi", 
      "sasaran_intervensi",
      "jumlah"
    ];
    
    const csvContent = headers.join(",");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_bantuan_sosial.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return alert('Pilih file CSV terlebih dahulu')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        // Parse CSV handling quoted fields with commas
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        if (lines.length < 2) return alert('File CSV kosong atau tidak valid')
        
        // Simple CSV parser for headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
        
        const parsedData = lines.slice(1).map(line => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current);
          
          const cleanedValues = values.map(v => String(v).trim().replace(/^"|"$/g, ''));
          
          const rowData: any = {}
          headers.forEach((h, i) => {
            const val = cleanedValues[i] || ''
            if (h === 'tahun') {
                rowData[h] = parseInt(val) || new Date().getFullYear();
            } else if (h === 'jumlah') {
                rowData[h] = parseInt(val) || 0;
            } else {
                rowData[h] = val
            }
          })
          
          return rowData
        })

        setIsImporting(true)
        await importCsvBantuanSosial(parsedData)
        alert(`Berhasil mengimpor ${parsedData.length} baris data!`)
        setIsImportModalOpen(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        
        // Refresh the page to get the updated data from server
        router.refresh()
        
      } catch (err: any) {
        alert('Gagal mengimpor CSV: ' + err.message)
      } finally {
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
  }

  const [activeTab, setActiveTab] = useState<'data' | 'rekap' | 'master'>('data')

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      {canEdit && (
        <div className="flex space-x-1 bg-white border border-gray-200 p-1 w-fit rounded-lg shadow-sm">
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'data' 
                ? 'bg-red-50 text-red-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Database size={16} />
            <span>Manajemen Data</span>
          </button>
          <button
            onClick={() => setActiveTab('rekap')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'rekap' 
                ? 'bg-red-50 text-red-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BarChart2 size={16} />
            <span>Rekapitulasi Wilayah</span>
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'master' 
                ? 'bg-red-50 text-red-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Settings size={16} />
            <span>Master Referensi</span>
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari wilayah atau program..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Filter size={16} />
            Filter
          </button>
          
          {canEdit && (
            <>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                <Upload size={16} />
                Import CSV
              </button>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Tambah Data
              </button>
            </>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Tahun/Periode</th>
              <th className="px-6 py-4 font-semibold">Wilayah</th>
              <th className="px-6 py-4 font-semibold">Program</th>
              <th className="px-6 py-4 font-semibold">Intervensi</th>
              <th className="px-6 py-4 font-semibold">Sasaran</th>
              <th className="px-6 py-4 font-semibold">Jumlah</th>
              {canEdit && <th className="px-6 py-4 font-semibold">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupedData.length > 0 ? (
              groupedData.map((group) => {
                const isExpanded = expandedGroups.has(group.key);
                return (
                  <React.Fragment key={group.key}>
                    {/* Parent Row */}
                    <tr 
                      onClick={() => toggleGroup(group.key)}
                      className="bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-gray-200"
                    >
                      <td className="px-6 py-4 flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                        <div>
                          <div className="font-bold text-gray-900">{group.tahun}</div>
                          <div className="text-gray-500 text-xs font-semibold">{group.periode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-500">{group.children.length} Wilayah</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{group.nama_program}</div>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                            {group.sumber_anggaran || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {group.bentuk_intervensi || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {group.sasaran_intervensi || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {(group.total_jumlah || 0).toLocaleString('id-ID')}
                      </td>
                      {canEdit && <td className="px-6 py-4"></td>}
                    </tr>

                    {/* Child Rows */}
                    {isExpanded && group.children.map(child => (
                      <tr key={child.id} className="hover:bg-gray-50 transition-colors bg-white">
                        <td className="py-3 pl-12 pr-6 border-l-2 border-transparent relative">
                           <div className="absolute left-6 top-0 bottom-1/2 w-4 border-l-2 border-b-2 border-gray-300 rounded-bl"></div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-900">{child.kalurahan}</div>
                          <div className="text-gray-500 text-xs">{child.kapanewon}</div>
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-xs" colSpan={3}>
                          Inherited from program
                        </td>
                        <td className="px-6 py-3 font-semibold text-gray-700">
                          {(child.jumlah || 0).toLocaleString('id-ID')}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <button className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors" title="Edit">
                                 <Edit2 size={16} />
                              </button>
                              <button className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors" title="Hapus">
                                 <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <BantuanSosialForm 
          masterData={masterData}
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleSuccess}
        />
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Import CSV Bantuan Sosial</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleImportSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4 border border-blue-100 flex flex-col gap-2">
                <div>
                  <p className="font-semibold mb-1">Format Kolom CSV yang didukung:</p>
                  <p className="font-mono text-xs opacity-90 break-all">tahun, periode, kapanewon, kalurahan, nama_program, sumber_anggaran, bentuk_intervensi, sasaran_intervensi, jumlah</p>
                </div>
                <p className="text-sm mt-1">
                  Pastikan format file sesuai dengan template.
                </p>
                <button 
                  type="button" 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold w-fit mt-1 transition-colors"
                >
                  <Download size={14} />
                  Unduh Template CSV
                </button>
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
                <button type="submit" disabled={isImporting} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm">
                  <FileUp size={16} />
                  <span>{isImporting ? 'Mengimpor...' : 'Mulai Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      )}

      {/* Rekapitulasi Tab Content */}
      {activeTab === 'rekap' && (
        <PivotTableBantuan data={filteredData} masterData={masterData} />
      )}

      {/* Master Referensi Tab Content */}
      {activeTab === 'master' && (
        <MasterReferensiManager />
      )}
    </div>
  )
}
