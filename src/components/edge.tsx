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
  useEffect(() => { inputRef.current?.focus(); }, [id, setEdges]);

  const isBackward = sourceX > targetX;
  const distance = Math.abs(sourceX - targetX);

  let edgePath;
  let labelX;
  let labelY;

  if (isBackward) {
    const curveHeight = 35 + distance * 0.12;
    const offsetX = 40;

    const cp1x = sourceX + offsetX;
    const cp1y = sourceY - curveHeight;

    const cp2x = targetX - offsetX;
    const cp2y = targetY - curveHeight;

    edgePath = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${targetX} ${targetY}`;

    labelX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    labelY = midY - (curveHeight * 0.75);

  } else {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

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