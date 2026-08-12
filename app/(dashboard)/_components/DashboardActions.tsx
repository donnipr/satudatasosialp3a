'use client'

import { Plus, Edit2, Trash2 } from 'lucide-react'

interface DashboardActionsProps {
  role: string;
}

export function DashboardActions({ role }: DashboardActionsProps) {
  // ROLE-BASED UI: Do not render action buttons for regular users
  if (role !== 'superuser') {
    return null;
  }

  return (
    <div className="flex gap-3 mb-6">
      <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
        <Plus size={18} />
        <span>Tambah Data Baru</span>
      </button>
      
      <button className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
        <Edit2 size={18} />
        <span>Edit Terpilih</span>
      </button>
      
      <button className="flex items-center space-x-2 bg-white hover:bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
        <Trash2 size={18} />
        <span>Hapus Terpilih</span>
      </button>
    </div>
  )
}
