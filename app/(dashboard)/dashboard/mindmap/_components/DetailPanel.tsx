'use client';

import { useEffect, useState } from 'react';
import type { TreeNode, LeafDetail } from '@/lib/mindmap/csv-to-tree';
import { LEVEL_NAMES } from '@/lib/mindmap/csv-to-tree';
import {
  FileText,
  Target,
  Wallet,
  TrendingUp,
  Calendar,
  Landmark,
  ChevronRight,
  MousePointerClick,
  Users,
  ClipboardList,
  BarChart3,
  X,
  Layers,
  Network
} from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────────────

interface DetailPanelProps {
  node: TreeNode | null;
  /** Mobile mode: renders as a bottom-sheet overlay instead of inline panel */
  mode?: 'inline' | 'mobile-sheet';
  /** Called when the mobile sheet is dismissed */
  onClose?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(value: string): string {
  if (value.startsWith('Rp')) return value;
  const num = parseInt(value.replace(/\D/g, ''), 10);
  if (isNaN(num)) return value;
  return 'Rp ' + num.toLocaleString('id-ID');
}

function parsePercentage(value: string): number {
  const num = parseFloat(value.replace(/[^0-9.,]/g, '').replace(',', '.'));
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
}

function hasValue(value: string): boolean {
  return value !== '-' && value.trim().length > 0;
}

// ─── Detail Content (Leaf Node) ──────────────────────────────────────────────

function LeafDetailContent({ detail, nodeName }: { detail: LeafDetail, nodeName: string }) {
  const percentage = parsePercentage(detail.capaianRealisasiPersentase);
  const isLow = percentage < 50;
  const isMedium = percentage >= 50 && percentage < 80;

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-5 z-10">
        {/* Tag */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide mb-3">
          <FileText className="w-3.5 h-3.5" />
          Rincian Kegiatan
        </span>
        {/* Title */}
        <h2 className="text-xl font-bold text-slate-800 leading-snug">
          {nodeName}
        </h2>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-3.5 border-b border-slate-50">
        <div className="flex items-center flex-wrap gap-1 text-[11px] text-slate-400">
          {detail.breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-slate-500 font-medium max-w-[180px] truncate" title={crumb}>
                {crumb}
              </span>
              {i < detail.breadcrumb.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="px-6 py-5 space-y-6">

        {/* ═══ CAPAIAN (Progress) ═══ */}
        <div className={`rounded-2xl p-5 border ${
          isLow ? 'bg-red-50/70 border-red-100/50' :
          isMedium ? 'bg-amber-50/70 border-amber-100/50' :
          'bg-emerald-50/70 border-emerald-100/50'
        }`}>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">
            Capaian Realisasi
          </p>

          {/* Percentage + Badge */}
          <div className="flex items-end justify-between mb-3">
            <span className={`text-3xl font-extrabold tabular-nums ${
              isLow ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {percentage}%
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isLow ? 'bg-red-100 text-red-700' :
              isMedium ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {isLow ? 'Perlu Perhatian' : isMedium ? 'Progres' : 'Baik'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isLow ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Nominal */}
          {hasValue(detail.capaianRealisasiNominal) && (
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <span className="font-medium">Nominal:</span>{' '}
                {detail.capaianRealisasiNominal}
              </span>
            </div>
          )}

          {/* Fisik */}
          {hasValue(detail.capaianRealisasiFisik) && (
            <div className="flex items-start gap-2 text-xs text-slate-600 mt-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <span className="font-medium">Fisik:</span>{' '}
                {detail.capaianRealisasiFisik}
              </span>
            </div>
          )}
        </div>

        {/* ═══ ANGGARAN ═══ */}
        <SectionCard title="Anggaran" icon={<Wallet className="w-4 h-4 text-red-500" />}>
          <div className="space-y-3">
            <div>
              <span className="text-[11px] text-slate-400 mb-1 block">Pagu Anggaran</span>
              <p className="text-2xl font-extrabold text-red-600 mt-0.5">
                {formatRupiah(detail.paguAnggaran)}
              </p>
            </div>
            {hasValue(detail.sumberAnggaran) && (
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100/80">
                <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 mb-1 block">Sumber</span>
                  <p className="text-sm text-slate-700 font-medium">{detail.sumberAnggaran}</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ═══ DESKRIPSI ═══ */}
        {hasValue(detail.deskripsiRincianKegiatan) && (
          <SectionCard title="Deskripsi" icon={<FileText className="w-4 h-4 text-slate-400" />}>
            <p className="text-sm leading-relaxed text-slate-700">
              {detail.deskripsiRincianKegiatan}
            </p>
          </SectionCard>
        )}

        {/* ═══ TARGET & SASARAN ═══ */}
        <SectionCard title="Target & Sasaran" icon={<Target className="w-4 h-4 text-slate-400" />}>
          <div className="space-y-3">
            {hasValue(detail.sasaran) && (
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Sasaran</span>
                <p className="text-sm text-slate-700 font-medium">{detail.sasaran}</p>
              </div>
            )}
            {hasValue(detail.bentukSasaran) && (
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Bentuk Sasaran</span>
                <p className="text-sm text-slate-700 font-medium">{detail.bentukSasaran}</p>
              </div>
            )}
            {hasValue(detail.daftarPenerimaManfaat) && (
              <div className="pt-3 border-t border-slate-100/80">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-400">Daftar Penerima Manfaat</span>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{detail.daftarPenerimaManfaat}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ═══ JADWAL ═══ */}
        {hasValue(detail.jadwalPelaksanaan) && (
          <SectionCard title="Jadwal Pelaksanaan" icon={<Calendar className="w-4 h-4 text-slate-400" />}>
            <p className="text-sm text-slate-700 font-medium">{detail.jadwalPelaksanaan}</p>
          </SectionCard>
        )}
      </div>
    </>
  );
}

// ─── Detail Content (Intermediate Node) ──────────────────────────────────────

function IntermediateNodeContent({ node }: { node: TreeNode }) {
  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-5 z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide mb-3">
          <Layers className="w-3.5 h-3.5" />
          {LEVEL_NAMES[node.level] || 'Node'}
        </span>
        <h2 className="text-xl font-bold text-slate-800 leading-snug">
          {node.name}
        </h2>
      </div>
      
      <div className="px-6 py-5 space-y-6">
         <SectionCard title="Informasi" icon={<Network className="w-4 h-4 text-slate-400" />}>
           <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Level Hierarki</span>
                <p className="text-sm text-slate-700 font-medium">{LEVEL_NAMES[node.level] || 'Root'}</p>
              </div>
              <div className="pt-3 border-t border-slate-100/80">
                <span className="text-[11px] text-slate-400 mb-1 block">Jumlah Turunan Langsung</span>
                <p className="text-sm text-slate-700 font-medium">{node.children.length} item</p>
              </div>
              <div className="pt-3 border-t border-slate-100/80">
                <span className="text-[11px] text-slate-400 mb-1 block">Total Item Tersarang</span>
                <p className="text-sm text-slate-700 font-medium">{node.childCount} item</p>
              </div>
           </div>
         </SectionCard>
      </div>
    </>
  );
}

function DetailContent({ node }: { node: TreeNode }) {
  if (node.level === 5 && node.data) {
    return <LeafDetailContent detail={node.data} nodeName={node.name} />;
  }
  return <IntermediateNodeContent node={node} />;
}


// ─── Placeholder (no selection) ──────────────────────────────────────────────

function Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
        <MousePointerClick className="w-9 h-9 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-400 mb-2">
        Belum ada data dipilih
      </h3>
      <p className="text-sm text-slate-400 max-w-[240px] leading-relaxed">
        Klik pada node <span className="font-medium text-slate-500">Rincian Kegiatan</span> di peta
        untuk melihat detail lengkap di sini.
      </p>
    </div>
  );
}

// ─── Detail Panel Component ─────────────────────────────────────────────────

export function DetailPanel({ node, mode = 'inline', onClose }: DetailPanelProps) {
  if (mode === 'inline') {
    if (!node) return <Placeholder />;
    return (
      <div className="h-full overflow-y-auto">
        <DetailContent node={node} />
      </div>
    );
  }

  return <MobileSheet node={node} onClose={onClose} />;
}

// ─── Mobile Bottom Sheet ─────────────────────────────────────────────────────

function MobileSheet({ node, onClose }: { node: TreeNode | null; onClose?: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (node) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [node]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 200);
  };

  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto
          transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle + close */}
        <div className="sticky top-0 z-20 bg-white rounded-t-2xl pt-3 pb-1 px-5 flex items-center justify-between">
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
          <button
            onClick={handleClose}
            className="absolute right-3 top-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <DetailContent node={node} />
      </div>
    </div>
  );
}

// ─── Reusable Section Card ───────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100/50 bg-slate-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{title}</span>
      </div>
      {children}
    </div>
  );
}
