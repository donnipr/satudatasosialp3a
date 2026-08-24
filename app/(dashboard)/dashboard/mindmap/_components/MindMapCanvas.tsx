'use client';

import { useMemo, useCallback, useEffect, type FC } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { type TreeNode, getAncestorIds } from '@/lib/mindmap/csv-to-tree';
import { computeLayout } from '@/lib/mindmap/layout-engine';
import { CustomNode, type MindMapNodeData } from './CustomNode';
import { CustomEdge } from './CustomEdge';

// ─── Register node/edge types outside component (React Flow requirement) ────

const nodeTypes: NodeTypes = {
  mindmapNode: CustomNode as unknown as NodeTypes['mindmapNode'],
};

const edgeTypes: EdgeTypes = {
  mindmapEdge: CustomEdge as unknown as EdgeTypes['mindmapEdge'],
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface MindMapCanvasProps {
  tree: TreeNode;
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}

// ─── Canvas Component ────────────────────────────────────────────────────────

export const MindMapCanvas: FC<MindMapCanvasProps> = ({
  tree,
  expandedNodes,
  selectedNodeId,
  onToggle,
  onSelect,
}) => {
  // Build the set of node IDs on the selected path (for edge highlighting)
  const selectedPathIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ancestors = getAncestorIds(selectedNodeId);
    return new Set([...ancestors, selectedNodeId]);
  }, [selectedNodeId]);

  const { fitView } = useReactFlow();

  // Smooth fitView when expanded nodes change
  useEffect(() => {
    // Small timeout ensures ReactFlow renders the new layout dimensions before fitting
    const timer = setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 50);
    return () => clearTimeout(timer);
  }, [expandedNodes.size, fitView]);

  // Compute layout and convert to React Flow format
  const { rfNodes, rfEdges } = useMemo(() => {
    const layout = computeLayout(tree, expandedNodes);

    const rfNodes: Node[] = layout.nodes.map((ln) => ({
      id: ln.id,
      type: 'mindmapNode',
      position: { x: ln.x, y: ln.y },
      data: {
        treeNode: ln.treeNode,
        rawNode: ln.treeNode,
        isExpanded: expandedNodes.has(ln.id),
        isSelected: selectedNodeId === ln.id,
        isOnSelectedPath: selectedPathIds.has(ln.id),
        onToggle,
        onSelect,
      } satisfies MindMapNodeData,
      draggable: false,
      selectable: false,
      connectable: false,
    }));

    const rfEdges: Edge[] = layout.edges.map((le) => {
      const isActive =
        selectedPathIds.has(le.source) && selectedPathIds.has(le.target);
      return {
        id: le.id,
        source: le.source,
        target: le.target,
        type: 'mindmapEdge',
        data: { isActive },
      };
    });

    return { rfNodes, rfEdges };
  }, [tree, expandedNodes, selectedNodeId, selectedPathIds, onToggle, onSelect]);

  // Force full re-render on structural changes via key
  const layoutKey = useMemo(
    () => `${expandedNodes.size}-${rfNodes.length}-${selectedNodeId}`,
    [expandedNodes.size, rfNodes.length, selectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    // Clicking empty canvas deselects (handled by parent if needed)
  }, []);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const data = node.data as MindMapNodeData;
      if (data.onSelect) data.onSelect(node.id);
      if (data.onToggle) data.onToggle(node.id);
    },
    []
  );

  return (
    <div className="w-full h-full" style={{ background: '#F8F9FA' }}>
      <ReactFlow
        key={layoutKey}
        nodes={rfNodes}
        edges={rfEdges}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={2}
        panOnScroll={false}
        zoomOnScroll={true}
        panOnDrag={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'mindmapEdge',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#E5E7EB"
          gap={24}
          size={1}
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-gray-200 !rounded-xl !shadow-lg"
        />
      </ReactFlow>
    </div>
  );
};
