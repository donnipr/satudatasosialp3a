'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  type TreeNode,
  type LeafDetail,
  collectNodeIds,
  collectAllNodeIds,
  findNodeById,
  getAncestorIds,
  fetchAndParseCSV,
  buildTree,
  SAMPLE_CSV_DATA,
} from '@/lib/mindmap/csv-to-tree';
import { MindMapCanvas } from './MindMapCanvas';
import { DetailPanel } from './DetailPanel';
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  Network,
  Expand,
  Shrink,
  Search,
  X,
  GitBranchPlus,
  FileText,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Count nodes at specific levels in the tree */
function countByLevel(node: TreeNode): { bidang: number; rincian: number; totalPagu: number } {
  let bidang = 0;
  let rincian = 0;
  let totalPagu = 0;

  function walk(n: TreeNode) {
    if (n.level === 1) bidang++;
    if (n.level === 5) {
      rincian++;
      if (n.data?.paguAnggaran) {
        const num = parseInt(n.data.paguAnggaran.replace(/\D/g, ''), 10);
        if (!isNaN(num)) totalPagu += num;
      }
    }
    n.children.forEach(walk);
  }
  walk(node);
  return { bidang, rincian, totalPagu };
}

/** Search for nodes whose name contains the query */
function searchNodes(node: TreeNode, query: string): TreeNode[] {
  const results: TreeNode[] = [];
  const lowerQuery = query.toLowerCase();

  function walk(n: TreeNode) {
    if (n.name.toLowerCase().includes(lowerQuery)) {
      results.push(n);
    }
    n.children.forEach(walk);
  }
  walk(node);
  return results;
}

import { useDataSourceContext } from '@/components/DataSourceContext';
import { YearSelector } from '@/components/YearSelector';

// ─── Main Client Component ──────────────────────────────────────────────────

export default function MindMapClient() {
  const { activeSource, isLoading: isContextLoading } = useDataSourceContext();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Data Fetching ──
  const loadData = useCallback(async () => {
    if (isContextLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      let data = null;
      if (activeSource?.url_csv) {
        data = await fetchAndParseCSV(activeSource.url_csv);
      } 
      
      if (!data || data.length === 0) {
        // Use sample data when no URL is configured or fetch fails to return rows
        data = SAMPLE_CSV_DATA;
      }

      const treeData = buildTree(data);
      setTree(treeData);

      // Default: expand only root (level 0)
      const defaultExpanded = collectNodeIds(treeData, 0);
      setExpandedNodes(defaultExpanded);
      setSelectedNodeId(null);
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to load mind map data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memuat data.'
      );
      
      // Fallback on error
      const treeData = buildTree(SAMPLE_CSV_DATA);
      setTree(treeData);
      setExpandedNodes(collectNodeIds(treeData, 0));
    } finally {
      setIsLoading(false);
    }
  }, [activeSource, isContextLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Statistics ──
  const stats = useMemo(() => {
    if (!tree) return null;
    return countByLevel(tree);
  }, [tree]);

  // ── Search results ──
  const searchResults = useMemo(() => {
    if (!tree || searchQuery.trim().length < 2) return [];
    return searchNodes(tree, searchQuery.trim());
  }, [tree, searchQuery]);

  // ── Toggle Expand/Collapse ──
  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // ── Node Selection ──
  const handleSelect = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);

      if (!tree) return;
      const node = findNodeById(tree, nodeId);
      setSelectedNode(node || null);

      // Auto-expand ancestors so the selected node is visible
      const ancestors = getAncestorIds(nodeId);
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        ancestors.forEach((id) => next.add(id));
        return next;
      });
    },
    [tree]
  );

  // ── Expand All ──
  const handleExpandAll = useCallback(() => {
    if (!tree) return;
    setExpandedNodes(collectAllNodeIds(tree));
  }, [tree]);

  // ── Collapse All (back to root + level 1) ──
  const handleCollapseAll = useCallback(() => {
    if (!tree) return;
    setExpandedNodes(collectNodeIds(tree, 1));
  }, [tree]);

  // ── Search navigation ──
  const navigateToSearchResult = useCallback(
    (index: number) => {
      if (searchResults.length === 0) return;
      const wrappedIndex = ((index % searchResults.length) + searchResults.length) % searchResults.length;
      setSearchResultIndex(wrappedIndex);

      const node = searchResults[wrappedIndex];
      handleSelect(node.id);
    },
    [searchResults, handleSelect]
  );

  // ── Search keyboard handler ──
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateToSearchResult(searchResultIndex + (e.shiftKey ? -1 : 1));
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    },
    [navigateToSearchResult, searchResultIndex]
  );

  // ── Open search with Ctrl+F ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Close mobile detail sheet ──
  const handleCloseMobileDetail = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodeId(null);
  }, []);

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem-2rem)] md:h-[calc(100vh-4rem-3rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500">Memuat data Mind Map...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !tree) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem-2rem)] md:h-[calc(100vh-4rem-3rem)]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Gagal Memuat Data</h3>
          <p className="text-sm text-gray-500">{error || 'Data tidak ditemukan.'}</p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg
              hover:bg-red-700 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Main Layout ──
  return (
    <div className="flex flex-col h-[calc(100vh-4rem-2rem)] md:h-[calc(100vh-4rem-3rem)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ═══ Top bar ═══ */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-gray-100 bg-white shrink-0 gap-3">
        {/* Left: Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-red-600" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-gray-900">Mind Map Program Kegiatan</h1>
            <p className="text-xs text-gray-400">Dinas Sosial P3A Kab. Gunungkidul</p>
          </div>
        </div>

        {/* Center: Stats badges */}
        {stats && (
          <div className="hidden md:flex items-center gap-3">
            <StatBadge icon={<GitBranchPlus className="w-3.5 h-3.5" />} label="Bidang" value={stats.bidang} />
            <StatBadge icon={<FileText className="w-3.5 h-3.5" />} label="Rincian" value={stats.rincian} />
            <StatBadge
              icon={<span className="text-[10px] font-bold">Rp</span>}
              label="Total Pagu"
              value={`${(stats.totalPagu / 1_000_000).toFixed(0)} Jt`}
            />
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Year Selector */}
          <div className="mr-2 hidden sm:block">
            <YearSelector />
          </div>

          {/* Search toggle */}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
              isSearchOpen
                ? 'bg-red-50 text-red-600'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Cari Node (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Expand All */}
          <button
            onClick={handleExpandAll}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Buka Semua"
          >
            <Expand className="w-4 h-4" />
          </button>

          {/* Collapse All */}
          <button
            onClick={handleCollapseAll}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Tutup Semua"
          >
            <Shrink className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Refresh */}
          <button
            onClick={loadData}
            disabled={isLoading || isContextLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600
              bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ═══ Search bar (collapsible) ═══ */}
      {isSearchOpen && (
        <div className="flex items-center gap-3 px-4 md:px-5 py-2.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResultIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari nama node... (Enter untuk navigasi)"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300
                placeholder:text-gray-400 transition-shadow"
            />
          </div>
          {searchQuery.length >= 2 && (
            <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
              {searchResults.length > 0
                ? `${searchResultIndex + 1} / ${searchResults.length}`
                : 'Tidak ditemukan'}
            </span>
          )}
          <button
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══ Split layout ═══ */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Mind Map Canvas */}
        <div className="w-full lg:w-[70%] h-full relative">
          <ReactFlowProvider>
            <MindMapCanvas
              tree={tree}
              expandedNodes={expandedNodes}
              selectedNodeId={selectedNodeId}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          </ReactFlowProvider>
        </div>

        {/* Right: Detail Panel (desktop only) */}
        <div className="hidden lg:block w-[30%] h-full border-l border-gray-200 bg-white shrink-0">
          <DetailPanel node={selectedNode} mode="inline" />
        </div>
      </div>

      {/* ═══ Mobile Detail Sheet ═══ */}
      <DetailPanel
        node={selectedNode}
        mode="mobile-sheet"
        onClose={handleCloseMobileDetail}
      />
    </div>
  );
}

// ─── Stat Badge ──────────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-gray-400">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-medium leading-none">{label}</span>
        <span className="text-sm font-bold text-gray-700 leading-tight">{value}</span>
      </div>
    </div>
  );
}
