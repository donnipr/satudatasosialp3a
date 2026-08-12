'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const GUNUNGKIDUL_REGIONS: Record<string, string[]> = {
  "Gedangsari": ["Hargomulyo", "Mertelu", "Ngalang", "Sampang", "Serut", "Tegalrejo", "Watugajah"],
  "Girisubo": ["Balong", "Jepitu", "Karangawen", "Nglindur", "Pucung", "Songbanyu", "Tileng", "Jerukwudel"],
  "Karangmojo": ["Bendungan", "Bejiharjo", "Gedangrejo", "Karangmojo", "Kelor", "Ngawis", "Ngipak", "Plumbon", "Wiladeg"],
  "Ngawen": ["Beji", "Jurangjero", "Kampung", "Sambirejo", "Tancep", "Watusigar"],
  "Nglipar": ["Katongan", "Kedungkeris", "Natah", "Nglipar", "Pengkol", "Pilangrejo"],
  "Paliyan": ["Giring", "Grogol", "Karangasem", "Karangduwet", "Mulusan", "Pamongtoko", "Sodo"],
  "Panggang": ["Giriharjo", "Girikarto", "Girisekar", "Girisuko", "Giriwungu", "Giricahyo"],
  "Patuk": ["Bunder", "Nglanggeran", "Nglegi", "Ngoro-oro", "Patuk", "Pengkok", "Putat", "Salam", "Semoyo", "Terbah", "Beji"],
  "Playen": ["Banaran", "Banyusoco", "Bleberan", "Dengok", "Gading", "Getas", "Logandeng", "Ngawu", "Ngunut", "Plembutan", "Playen", "Nglipar"],
  "Ponjong": ["Bedoyo", "Genjahan", "Gombang", "Karangmojo", "Kenteng", "Ponjong", "Sawahan", "Somandeng", "Sumbergiri", "Tambakromo", "Umbulrejo"],
  "Purwosari": ["Giricahyo", "Girijati", "Giripurwo", "Giritirto", "Giriyoso"],
  "Rongkop": ["Bohol", "Botodayaan", "Karangwuni", "Melikan", "Petir", "Pringombo", "Pucanganom", "Semugih"],
  "Saptosari": ["Jetis", "Kanigoro", "Kepek", "Krambilsawit", "Monggol", "Ngloro", "Planjan"],
  "Semanu": ["Candirejo", "Dadapayu", "Ngeposari", "Pacarejo", "Semanu"],
  "Semin": ["Bendung", "Bulu", "Candirejo", "Kalitekuk", "Karangsari", "Kemejing", "Pundungsari", "Rejosari", "Sumberejo", "Semin"],
  "Tanjungsari": ["Banjarejo", "Hargosari", "Kemadang", "Kemiri", "Ngestirejo"],
  "Tepus": ["Bikuk", "Giripanggung", "Purwodadi", "Sidoharjo", "Sumberwungu", "Tepus"],
  "Wonosari": ["Baleharjo", "Duwet", "Gari", "Karangrejek", "Karangtengah", "Kepek", "Mulo", "Piyaman", "Pulutan", "Selang", "Siraman", "Wareng", "Wonosari", "Wunung"]
};

export default function BantuanSosialForm({ 
  masterData, 
  onClose, 
  onSuccess 
}: { 
  masterData: any[], 
  onClose: () => void,
  onSuccess: (data: any) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  // Extract categories from masterData
  const optionsTahun = masterData.filter(d => d.kategori === 'TAHUN').map(d => d.nilai)
  const optionsPeriode = masterData.filter(d => d.kategori === 'PERIODE').map(d => d.nilai)
  const optionsProgram = masterData.filter(d => d.kategori === 'PROGRAM').map(d => d.nilai)
  const optionsAnggaran = masterData.filter(d => d.kategori === 'SUMBER_ANGGARAN').map(d => d.nilai)
  const optionsIntervensi = masterData.filter(d => d.kategori === 'BENTUK_INTERVENSI').map(d => d.nilai)
  const optionsSasaran = masterData.filter(d => d.kategori === 'SASARAN').map(d => d.nilai)

  const [formData, setFormData] = useState({
    tahun: optionsTahun[0] || '',
    periode: optionsPeriode[0] || '',
    kapanewon: '',
    kalurahan: '',
    nama_program: optionsProgram[0] || '',
    sumber_anggaran: optionsAnggaran[0] || '',
    bentuk_intervensi: optionsIntervensi[0] || '',
    sasaran_intervensi: optionsSasaran[0] || '',
    jumlah: 0
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Cascading dropdown reset logic
    if (name === 'kapanewon') {
      setFormData({ 
        ...formData, 
        kapanewon: value, 
        kalurahan: ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const { data, error } = await supabase
      .from('bantuan_sosial')
      .insert([formData])
      .select()

    setIsSubmitting(false)

    if (error) {
      setError(error.message)
    } else if (data && data.length > 0) {
      onSuccess(data[0])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tambah Data Bantuan</h2>
            <p className="text-sm text-gray-500">Pilih data referensi untuk mencatat bantuan sosial baru.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form id="bansos-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Waktu Pelaksanaan */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Waktu Pelaksanaan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                  <select name="tahun" value={formData.tahun} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="" disabled>Pilih Tahun...</option>
                    {optionsTahun.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                  <select name="periode" value={formData.periode} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="" disabled>Pilih Periode...</option>
                    {optionsPeriode.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Wilayah Sasaran */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Wilayah Sasaran</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapanewon</label>
                  <select name="kapanewon" value={formData.kapanewon} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="" disabled>Pilih Kapanewon...</option>
                    {Object.keys(GUNUNGKIDUL_REGIONS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kalurahan</label>
                  <select name="kalurahan" value={formData.kalurahan} onChange={handleChange} required disabled={!formData.kapanewon} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <option value="" disabled>Pilih Kalurahan...</option>
                    {(GUNUNGKIDUL_REGIONS[formData.kapanewon] || []).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Detail Bantuan */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Detail Bantuan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Program</label>
                  <select name="nama_program" value={formData.nama_program} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="" disabled>Pilih Program...</option>
                    {optionsProgram.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Anggaran</label>
                  <select name="sumber_anggaran" value={formData.sumber_anggaran} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="" disabled>Pilih Sumber Anggaran...</option>
                    {optionsAnggaran.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bentuk Intervensi</label>
                  <select name="bentuk_intervensi" value={formData.bentuk_intervensi} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="" disabled>Pilih Bentuk Intervensi...</option>
                    {optionsIntervensi.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sasaran</label>
                  <select name="sasaran_intervensi" value={formData.sasaran_intervensi} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <option value="" disabled>Pilih Sasaran...</option>
                    {optionsSasaran.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Penerima / Bantuan</label>
                  <input type="number" name="jumlah" value={formData.jumlah} onChange={handleNumberChange} min={0} required placeholder="Contoh: 150" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit" 
            form="bansos-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Data
          </button>
        </div>

      </div>
    </div>
  )
}
