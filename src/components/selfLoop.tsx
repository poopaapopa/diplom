import React from 'react';
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
            className="fsm-edge-input"
            defaultValue={data?.symbol as string || ''}
            onChange={onInputChange}
            placeholder="ε"
            maxLength={5}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default SelfLoopEdge;