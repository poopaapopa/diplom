import React from 'react';
import {
  Handle,
  Position,
  useReactFlow,
  NodeProps,
  MarkerType,
} from '@xyflow/react';

const FSMNode = ({ id, data }: NodeProps) => {
  const { setEdges, getEdges } = useReactFlow();

  const toggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();

    const edges = getEdges();
    const loopEdgeId = `loop-${id}`;
    const existingLoop = edges.find((edge) => edge.id === loopEdgeId);

    if (existingLoop) {
      setEdges((eds) => eds.filter((edge) => edge.id !== loopEdgeId));
    } else {
      const newEdge = {
        id: loopEdgeId,
        source: id,
        target: id,
        sourceHandle: 'loop-source',
        targetHandle: 'loop-target',
        type: 'selfloop',
        style: {
          strokeWidth: 2,
          stroke: '#222'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#222',
        },
      };

      setEdges((eds) => [...eds, newEdge]);
    }
  };

  return (
    <div className={`fsm-node ${data.isInitial ? 'initial' : ''}`}>
      <div className="fsm-node__loop-dot" onClick={toggleLoop} />

      <Handle
        type="source"
        position={Position.Top}
        id="loop-source"
        style={{ left: '60%', opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="loop-target"
        style={{ left: '40%', opacity: 0, pointerEvents: 'none' }}
      />

      <Handle type="target" position={Position.Left} id="main-target" />
      <div className="fsm-node-inner">{data.label as string}</div>
      <Handle type="source" position={Position.Right} id="main-source" />
    </div>
  );
};

export default FSMNode;