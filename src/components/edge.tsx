import React, { useEffect, useRef } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
  useReactFlow,
} from '@xyflow/react';

function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [id, setEdges]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return { ...edge, data: { ...edge.data, symbol: evt.target.value } };
        }
        return edge;
      })
    );
  };

  const onBlur = () => {
    const symbol = (data?.symbol as string) || "";

    if (symbol.trim() === "") {
      setEdges((eds) =>
        eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, symbol: "ε" } } : e))
      );
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 15}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <input
            ref={inputRef}
            className="fsm-input"
            defaultValue={data?.symbol as string}
            onChange={onInputChange}
            onBlur={onBlur}
            maxLength={1}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default TransitionEdge;