import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  NodeProps,
  OnConnect,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const FSMNode = ({ data }: NodeProps) => {
  return (
    <div className="fsm-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      <div className="fsm-node-inner">{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
    </div>
  );
};

const nodeTypes = {
  fsmNode: FSMNode,
};

const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#333',
  },
  style: {
    strokeWidth: 2,
    stroke: '#333',
  },
};

const initialNodes = [
  {
    id: 'start-anchor',
    type: 'input',
    sourcePosition: Position.Right,
    data: { label: '' },
    position: { x: 25, y: 124.2 },
    draggable: false,
    connectable: false,
    selectable: false,
    style: {
      opacity: 0,
      width: 0,
      height: 0,
      padding: 0,
      pointerEvents: 'none'
    },
  },
  { id: '0', type: 'fsmNode', position: { x: 100, y: 100 }, data: { label: '0' } },
];

const initialEdges = [
  {
    id: 'start-edge',
    source: 'start-anchor',
    target: '0',
    selectable: false,
    deletable: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#333',
    },
    style: {
      strokeWidth: 2,
      stroke: '#333',
    },
  },
];

function Flow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = String(nodes.length - 1);
      const newNode = {
        id: newNodeId,
        type: 'fsmNode',
        position,
        data: { label: newNodeId },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, screenToFlowPosition]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onPaneClick={(e) => {
          if (e.detail === 2) onPaneDoubleClick(e);
        }}
        defaultViewport={{ x: 100, y: 75, zoom: 2 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return React.createElement(ReactFlowProvider, { children: <Flow /> });
}
