'use client';

import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

// ─── Custom Edge Component ───────────────────────────────────────────────────

function CustomEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const isActive = (data as Record<string, unknown>)?.isActive === true;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: isActive ? '#DC2626' : '#E5E7EB',
        strokeWidth: isActive ? 2 : 1.5,
        transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
      }}
    />
  );
}

export const CustomEdge = memo(CustomEdgeInner);
