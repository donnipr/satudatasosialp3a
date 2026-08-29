import React from 'react';

export default function DataPSKSPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Data PSKS</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola dan pantau data Potensi dan Sumber Kesejahteraan Sosial (PSKS).</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Halaman Sedang Dalam Pengembangan</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Fitur Manajemen Data PSKS sedang dipersiapkan. Segera hadir untuk memberikan pengalaman pengelolaan data yang lebih baik.
        </p>
      </div>
    </div>
  );
}
