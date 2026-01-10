import React, { useEffect, useRef } from 'react';
import {
  Handle,
  Position,
  useReactFlow,
  NodeProps,
  MarkerType,
} from '@xyflow/react';

const FSMNode = ({ id, data }: NodeProps) => {
  const { setEdges, getEdges, setNodes } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeClasses = `fsm-node ${data.isInitial ? 'initial' : ''} ${data.isFinal ? 'final' : ''}`;

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

  useEffect(() => {
    inputRef.current?.focus();
  }, [id, setNodes]);

  const onLabelChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, label: evt.target.value } };
        }
        return n;
      })
    );
  };

  const onBlur = () => {
    if (!data.label || (data.label as string).trim() === "") {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: `q${id}` } } : n))
      );
    }
  };

  return (
    <div className={nodeClasses}>
      <div className="fsm-node__loop-dot" onClick={toggleLoop} />

      <Handle
        type="source"
        position={Position.Top}
        id="loop-source"
        isConnectable={false}
        style={{ left: '60%', opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="loop-target"
        isConnectable={false}
        style={{ left: '40%', opacity: 0, pointerEvents: 'none' }}
      />

      <Handle type="target" position={Position.Left} id="main-target" />
      <input
        ref={inputRef}
        className="fsm-input"
        value={data.label as string}
        onChange={onLabelChange}
        onBlur={onBlur}
        maxLength={3}
      />
      <Handle type="source" position={Position.Right} id="main-source" />
    </div>
  );
};

export default FSMNode;