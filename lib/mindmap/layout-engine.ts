import type { TreeNode } from './csv-to-tree';

// ─── Layout Constants ────────────────────────────────────────────────────────

const NODE_WIDTH = 260;
const NODE_HEIGHT = 64;
const H_GAP = 340; // horizontal spacing between depth levels
const V_GAP = 18;  // vertical spacing between sibling nodes

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  treeNode: TreeNode;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  totalWidth: number;
  totalHeight: number;
}

// ─── Layout Engine ───────────────────────────────────────────────────────────

/**
 * Computes left-to-right tree layout positions for all visible nodes.
 * A node's children are visible only if the node is in the `expandedNodes` set.
 * Parents are vertically centered among their children.
 */
export function computeLayout(
  root: TreeNode,
  expandedNodes: Set<string>
): LayoutResult {
  const layoutNodes: LayoutNode[] = [];
  const layoutEdges: LayoutEdge[] = [];
  let maxX = 0;
  let maxY = 0;

  /**
   * Calculate the total vertical space a subtree occupies.
   */
  function getSubtreeHeight(node: TreeNode): number {
    const isExpanded = expandedNodes.has(node.id);
    if (node.children.length === 0 || !isExpanded) {
      return NODE_HEIGHT;
    }

    let totalChildrenHeight = 0;
    for (let i = 0; i < node.children.length; i++) {
      totalChildrenHeight += getSubtreeHeight(node.children[i]);
      if (i < node.children.length - 1) {
        totalChildrenHeight += V_GAP;
      }
    }
    return Math.max(NODE_HEIGHT, totalChildrenHeight);
  }

  /**
   * Recursively position nodes. Returns the subtree height consumed.
   */
  function positionNode(node: TreeNode, depth: number, yOffset: number): number {
    const x = depth * H_GAP;
    const subtreeHeight = getSubtreeHeight(node);

    // Center the node vertically within its subtree area
    const y = yOffset + subtreeHeight / 2 - NODE_HEIGHT / 2;

    layoutNodes.push({
      id: node.id,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      treeNode: node,
    });

    // Track bounds
    if (x + NODE_WIDTH > maxX) maxX = x + NODE_WIDTH;
    if (y + NODE_HEIGHT > maxY) maxY = y + NODE_HEIGHT;

    const isExpanded = expandedNodes.has(node.id);
    if (node.children.length > 0 && isExpanded) {
      let currentY = yOffset;
      for (const child of node.children) {
        const childSubtreeHeight = getSubtreeHeight(child);

        // Create edge from parent to child
        layoutEdges.push({
          id: `e-${node.id}__${child.id}`,
          source: node.id,
          target: child.id,
        });

        // Recursively position child
        positionNode(child, depth + 1, currentY);
        currentY += childSubtreeHeight + V_GAP;
      }
    }

    return subtreeHeight;
  }

  positionNode(root, 0, 0);

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    totalWidth: maxX + 80,
    totalHeight: maxY + 80,
  };
}

export { NODE_WIDTH, NODE_HEIGHT };
