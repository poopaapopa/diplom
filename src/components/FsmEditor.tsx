import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  MarkerType,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  OnConnect,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FSMNode from './node';
import SelfLoopEdge from "./selfLoop";
import TransitionEdge from "./edge";

const nodeTypes = {
  fsmNode: FSMNode,
};
const edgeTypes = {
  selfloop: SelfLoopEdge,
  transition: TransitionEdge,
};

const defaultEdgeOptions = {
  type: 'transition',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#333',
  },
  style: {
    strokeWidth: 2,
    stroke: '#333',
  },
};

interface FsmEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  readOnly?: boolean;
}

export default function FsmEditor({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  readOnly = false,
}: FsmEditorProps) {
  const { screenToFlowPosition } = useReactFlow();

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              isFinal: !n.data.isFinal,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes, readOnly]);

  const onConnect: OnConnect = useCallback((params) => {
    if (readOnly) return;
    setEdges((eds) => {
      const isSelfLoop = params.source === params.target;

      if (!isSelfLoop)
        return addEdge(params, eds);

      const loopId = `loop-${params.source}`;
      if (eds.some((e) => e.id === loopId)) return eds;

      return addEdge({
        ...params,
        id: loopId,
        type: 'selfloop',
        sourceHandle: 'loop-source',
        targetHandle: 'loop-target',
      }, eds);
    });
  }, [setEdges, readOnly]);

  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (readOnly) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = String(nodes.length - 1);
      const newNode = {
        id: newNodeId,
        type: 'fsmNode',
        position,
        data: { label: `q${newNodeId}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes.length, screenToFlowPosition, setNodes, readOnly]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={readOnly ? undefined : onNodesChange}
      onEdgesChange={readOnly ? undefined : onEdgesChange}
      onConnect={onConnect}
      onNodeDoubleClick={onNodeDoubleClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      onPaneClick={(e) => {
        if (e.detail === 2) onPaneDoubleClick(e);
      }}
      defaultViewport={{ x: 100, y: 85, zoom: 2 }}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      elementsSelectable={!readOnly}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}
