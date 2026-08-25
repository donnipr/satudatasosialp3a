'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Package, Users, MapPin, CheckCircle2, Clock, Loader2, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';

export function BansosOverview() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchBansos = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: bansosData, error } = await supabase
          .from('bantuan_sosial')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (mounted && bansosData) {
          setData(bansosData);
        }
      } catch (err) {
        console.error('Failed to fetch bansos data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchBansos();
    return () => { mounted = false; };
  }, []);

  const { totalProgram, totalPenerima, totalKapanewon, chartData, recentActivities } = useMemo(() => {
    const uniquePrograms = new Set();
    const uniqueKapanewon = new Set();
    let tPenerima = 0;
    const programMap: Record<string, number> = {};

    data.forEach(item => {
      if (item.nama_program) uniquePrograms.add(item.nama_program);
      if (item.kapanewon) uniqueKapanewon.add(item.kapanewon);
      
      const jumlah = parseInt(item.jumlah) || 0;
      tPenerima += jumlah;

      if (item.nama_program) {
        if (!programMap[item.nama_program]) programMap[item.nama_program] = 0;
        programMap[item.nama_program] += jumlah;
      }
    });

    const cData = Object.entries(programMap)
      .map(([name, penerima]) => ({ name, penerima }))
      .sort((a, b) => b.penerima - a.penerima)
      .slice(0, 5); // top 5
      
    // Recent Activities (Latest 5 entries)
    const rActivities = data.slice(0, 5).map((item, idx) => ({
      id: item.id || idx,
      title: item.nama_program,
      wilayah: `${item.kalurahan}, ${item.kapanewon}`,
      sumber: item.sumber_anggaran || '-',
      type: 'success', // Fallback status as we assume completed logs
      status: 'Terdata',
      waktu: item.periode ? `Periode ${item.periode}` : 'Baru Saja'
    }));

    return {
      totalProgram: uniquePrograms.size,
      totalPenerima: tPenerima,
      totalKapanewon: uniqueKapanewon.size,
      chartData: cData,
      recentActivities: rActivities
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
        <p className="text-sm font-medium text-slate-600">Mengambil Data Bantuan Sosial...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in text-center px-4">
        <Info className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Belum Ada Data Bansos</h3>
        <p className="text-sm text-slate-500 max-w-sm">Data bantuan sosial masih kosong. Tambahkan data melalui menu Manajemen Bantuan Sosial untuk melihat metrik ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Cards - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Program Bansos</h3>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Package size={22} />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{totalProgram} Program</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Aktif Berjalan Tahun Ini</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Penerima Manfaat</h3>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{totalPenerima.toLocaleString('id-ID')}</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Keluarga/Individu Terjangkau</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Jangkauan Wilayah</h3>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <MapPin size={22} />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{totalKapanewon} Kapanewon</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Distribusi Menyeluruh</p>
          </div>
        </div>
      </div>

      {/* Charts & Lists - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Top 5 Program */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Program (Jumlah Penerima)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="penerima" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Daftar Penyaluran Terbaru</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                <div className="mt-1">
                  {activity.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <MapPin size={12} /> {activity.wilayah}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    activity.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activity.status}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {activity.sumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
