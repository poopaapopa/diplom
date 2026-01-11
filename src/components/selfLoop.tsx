import React, {useEffect, useRef} from 'react';
import {
  EdgeProps,
  EdgeLabelRenderer,
  useReactFlow,
} from '@xyflow/react';

function SelfLoopEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  const { setEdges } = useReactFlow();

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, [id, setEdges]);

  const radius = 25;
  const loopHeight = 50;

  const edgePath = `
    M ${sourceX} ${sourceY} 
    C ${sourceX + radius} ${sourceY - loopHeight}, 
      ${targetX - radius} ${targetY - loopHeight}, 
      ${targetX} ${targetY}
  `;

  const labelX = (sourceX + targetX) / 2;
  const labelY = sourceY - loopHeight + 5;

  const onInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const val = evt.target.value;
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return { ...edge, data: { ...edge.data, symbol: val } };
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
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <input
            ref={inputRef}
            className="fsm-input"
            defaultValue={data?.symbol as string || ''}
            onChange={onInputChange}
            onBlur={onBlur}
            maxLength={1}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default SelfLoopEdge;