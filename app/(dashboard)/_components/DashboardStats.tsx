import { Users, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Warga Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between group">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Data Warga</p>
          <h3 className="text-2xl font-bold text-gray-900">24,591</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
            <TrendingUp size={14} className="mr-1" />
            +12% bulan ini
          </p>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
          <Users size={24} />
        </div>
      </div>

      {/* Menunggu Verifikasi Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between group">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Menunggu Verifikasi</p>
          <h3 className="text-2xl font-bold text-gray-900">142</h3>
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            Perlu tindakan segera
          </p>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
          <AlertCircle size={24} />
        </div>
      </div>

      {/* Terverifikasi Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between group">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Terverifikasi</p>
          <h3 className="text-2xl font-bold text-gray-900">23,940</h3>
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            Data valid aktif
          </p>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
          <CheckCircle2 size={24} />
        </div>
      </div>
      
      {/* Penerima Bantuan Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between group">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Penerima Bantuan</p>
          <h3 className="text-2xl font-bold text-gray-900">8,405</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
            <TrendingUp size={14} className="mr-1" />
            Sesuai target
          </p>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
          <Users size={24} />
        </div>
      </div>
    </div>
  )
}
