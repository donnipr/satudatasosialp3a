'use client';

import { memo, type FC } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2, ClipboardList, Cog, Pin, FileText, Plus, Minus } from 'lucide-react';
import { LEVEL_NAMES, LEVEL_COLORS, type TreeNode, type LeafDetail } from '@/lib/mindmap/csv-to-tree';

// ─── Data passed into each React Flow node ───────────────────────────────────

export interface MindMapNodeData {
  treeNode: TreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  isOnSelectedPath: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  [key: string]: unknown;
}

// ─── Level icons ─────────────────────────────────────────────────────────────

const LEVEL_ICONS: FC<{ className?: string }>[] = [
  ({ className }) => <Building2 className={className} />,        // root
  ({ className }) => <Building2 className={className} />,        // bidang
  ({ className }) => <ClipboardList className={className} />,    // program
  ({ className }) => <Cog className={className} />,              // kegiatan
  ({ className }) => <Pin className={className} />,              // sub
  ({ className }) => <FileText className={className} />,         // rincian
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if a leaf has low capaian (< 50%) for the pulse indicator */
function isLowCapaian(data?: LeafDetail): boolean {
  if (!data) return false;
  const raw = data.capaianRealisasiPersentase;
  if (!raw || raw === '-') return false;
  const num = parseFloat(raw.replace(/[^0-9.,]/g, '').replace(',', '.'));
  return !isNaN(num) && num < 50;
}

// ─── Custom Node Component ───────────────────────────────────────────────────

function CustomNodeInner({ data }: NodeProps) {
  const {
    treeNode,
    isExpanded,
    isSelected,
    isOnSelectedPath,
    onToggle,
    onSelect,
  } = data as MindMapNodeData;

  const { id, name, level, children, childCount } = treeNode;
  const hasChildren = children.length > 0;
  const isLeaf = level === 5;
  const LevelIcon = LEVEL_ICONS[level] || LEVEL_ICONS[0];
  const accentColor = LEVEL_COLORS[level] || LEVEL_COLORS[0];
  const showPulse = isLeaf && isLowCapaian(treeNode.data);

  // Node clicks are handled by the parent ReactFlow `onNodeClick`.
  // The +/- button uses this explicit handler to prevent double firing.

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(id);
    onSelect(id);
  };

  return (
    <>
      {/* Target handle (left side) – hidden for root */}
      {level > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-0 !h-0 !border-0 !bg-transparent !min-w-0 !min-h-0"
        />
      )}

      <div
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 bg-white cursor-pointer
          transition-all duration-200 ease-out select-none min-w-[180px] max-w-[260px]
          hover:-translate-y-px
          ${isSelected
            ? 'rounded-xl border-2 shadow-md'
            : isOnSelectedPath
              ? 'rounded-xl border-2 shadow-sm'
              : 'rounded-lg border border-slate-200 shadow-sm'
          }`}
        style={{
          borderColor: isSelected
            ? accentColor
            : isOnSelectedPath
              ? `${accentColor}50`
              : undefined,
          boxShadow: isSelected
            ? `0 0 0 3px ${accentColor}12, 0 2px 8px rgba(0,0,0,0.06)`
            : undefined,
        }}
      >
        {/* Pulse indicator for low capaian */}
        {showPulse && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}

        {/* Level icon */}
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors duration-200 ${
            isSelected ? '' : 'bg-slate-50'
          }`}
          style={isSelected ? { backgroundColor: `${accentColor}12`, color: accentColor } : undefined}
        >
          <LevelIcon className={`w-3.5 h-3.5 ${isSelected ? '' : 'text-slate-400'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p
            className={`text-xs font-medium leading-tight truncate ${
              isSelected ? 'text-slate-800' : 'text-slate-700'
            }`}
            title={name}
          >
            {name}
          </p>
          {hasChildren && !isLeaf && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {childCount} item{(childCount ?? 0) > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Expand/collapse +/- button */}
        {hasChildren && !isLeaf && (
          <button
            onClick={handleToggleClick}
            className={`flex items-center justify-center w-6 h-6 shrink-0 transition-colors duration-150 ${
              isExpanded
                ? 'rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200'
                : 'rounded-md bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            {isExpanded ? (
              <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
            ) : (
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>

      {/* Source handle (right side) – hidden for leaf */}
      {hasChildren && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-0 !h-0 !border-0 !bg-transparent !min-w-0 !min-h-0"
        />
      )}
    </>
  );
}

export const CustomNode = memo(CustomNodeInner);
