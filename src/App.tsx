import React, { useCallback, useState } from 'react';
import {
  Edge,
  ReactFlow,
  addEdge,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  Position,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  Node,
  NodeChange,
  EdgeChange,
  OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FSMNode from './components/node';
import SelfLoopEdge from "./components/selfLoop";

const nodeTypes = {
  fsmNode: FSMNode,
};
const edgeTypes = {
  selfloop: SelfLoopEdge,
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

const initialNodes: Node[] = [
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

const initialEdges: Edge[] = [
  {
    id: 'start-edge',
    source: 'start-anchor',
    target: '0',
    targetHandle: 'main-target',
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
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
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
  }, [setNodes]);
  const onConnect: OnConnect = useCallback((params) => {
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
  }, [setEdges]);

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
    [nodes.length, screenToFlowPosition]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
