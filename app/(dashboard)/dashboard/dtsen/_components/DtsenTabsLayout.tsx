'use client'

import { useState } from 'react'
import { Database, BarChart3, RefreshCw } from 'lucide-react'

export function DtsenTabsLayout({ 
  toolbar, 
  table, 
  summary 
}: { 
  toolbar: React.ReactNode, 
  table: React.ReactNode, 
  summary: React.ReactNode 
}) {
  const [activeTab, setActiveTab] = useState<'manajemen' | 'analisis'>('manajemen')

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100/80 p-1.5 rounded-xl mb-6 w-fit border border-gray-200 shadow-sm">
        <button
          onClick={() => setActiveTab('manajemen')}
          className={`flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'manajemen' 
              ? 'bg-white text-red-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <Database size={18} className="mr-2" />
          Manajemen Data
        </button>
        <button
          onClick={() => setActiveTab('analisis')}
          className={`flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'analisis' 
              ? 'bg-white text-red-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <BarChart3 size={18} className="mr-2" />
          Analisis Statistik
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'manajemen' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              {toolbar}
              <button className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                <RefreshCw size={16} />
                <span>Muat Ulang</span>
              </button>
            </div>
            {table}
          </div>
        )}

        {activeTab === 'analisis' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {summary}
          </div>
        )}
      </div>
    </div>
  )
}
