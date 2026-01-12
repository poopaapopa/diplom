import React, { useCallback, useEffect, useState } from 'react';
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
import TransitionEdge from "./components/edge";
import { fsmToRegex } from "./utils/convertToRegex.ts";

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

const initialNodes: Node[] = [
  {
    id: 'start-anchor',
    type: 'input',
    sourcePosition: Position.Right,
    data: { label: '' },
    position: { x: 25, y: 114.2 },
    draggable: false,
    connectable: false,
    selectable: false,
    style: { opacity: 0, width: 0, height: 0, pointerEvents: 'none' },
  },
  { id: '0', type: 'fsmNode', position: { x: 100, y: 100 }, data: { label: 'q0' } },
];

const initialEdges: Edge[] = [
  {
    id: 'start-edge',
    source: 'start-anchor',
    type: 'default',
    target: '0',
    targetHandle: 'main-target',
    selectable: false,
    deletable: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#333',
    },
  },
];

function Flow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [regex, setRegex] = useState<string>('');

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
        data: { label: `q${newNodeId}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes.length, screenToFlowPosition]
  );

  useEffect(() => {
    const result = fsmToRegex(nodes, edges);
    setRegex(result);
  }, [nodes, edges]);

  const isHint = regex.includes("Начните") ||
                 regex.includes("Сделайте") ||
                 regex.includes("Путь");

  return (
    <div className="layout">
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
        defaultViewport={{ x: 100, y: 85, zoom: 2 }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      <div className="regex-footer">
        <div className={`regex-card ${isHint ? 'is-hint' : ''}`}>
          <label className="regex-label">
            {isHint ? "Статус автомата" : "Регулярное выражение"}
          </label>

          <div className="regex-input-wrapper">
            <input
              className="regex-display"
              value={regex}
              readOnly
              placeholder="Создайте автомат..."
            />

            {!isHint && (
              <button
                className="copy-svg-btn"
                onClick={() => navigator.clipboard.writeText(regex)}
                title="Скопировать выражение"
              >
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.33337 25H6.66671C5.78265 25 4.93481 24.6488 4.30968 24.0237C3.68456 23.3985 3.33337 22.5507 3.33337 21.6666V6.66665C3.33337 5.78259 3.68456 4.93474 4.30968 4.30962C4.93481 3.6845 5.78265 3.33331 6.66671 3.33331H21.6667C22.5508 3.33331 23.3986 3.6845 24.0237 4.30962C24.6489 4.93474 25 5.78259 25 6.66665V8.33331M18.3334 15H33.3334C35.1743 15 36.6667 16.4924 36.6667 18.3333V33.3333C36.6667 35.1743 35.1743 36.6666 33.3334 36.6666H18.3334C16.4924 36.6666 15 35.1743 15 33.3333V18.3333C15 16.4924 16.4924 15 18.3334 15Z"
                        stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return React.createElement(ReactFlowProvider, { children: <Flow /> });
}
