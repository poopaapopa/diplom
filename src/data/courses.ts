import { Node, Edge, MarkerType, Position } from '@xyflow/react';

export interface RegexToFsmLevel {
  id: number;
  regex: string;
  description: string;
}

export interface FsmToRegexLevel {
  id: number;
  nodes: Node[];
  edges: Edge[];
  description: string;
  targetRegex: string; // For simple validation or hints
}

export const regexToFsmCourse: RegexToFsmLevel[] = [
  {
    id: 1,
    regex: 'a',
    description: 'Постройте автомат, принимающий только строку "a".',
  },
  {
    id: 2,
    regex: 'ab',
    description: 'Постройте автомат, принимающий строку "ab" (конкатенация).',
  },
  {
    id: 3,
    regex: 'a|b',
    description: 'Постройте автомат, принимающий "a" или "b" (альтернатива).',
  },
  {
    id: 4,
    regex: 'a*',
    description: 'Постройте автомат, принимающий любое количество "a", включая пустую строку (звезда Клини).',
  },
  {
    id: 5,
    regex: '(a|b)*abb',
    description: 'Постройте автомат, принимающий строки из "a" и "b", оканчивающиеся на "abb".',
  }
];

const defaultEdgeOptions = {
  type: 'transition',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#333' },
  style: { strokeWidth: 2, stroke: '#333' },
};

export const fsmToRegexCourse: FsmToRegexLevel[] = [
  {
    id: 1,
    description: 'Напишите регулярное выражение для этого автомата.',
    targetRegex: 'a',
    nodes: [
      { id: 'start-anchor', type: 'input', sourcePosition: Position.Right, data: { label: '' }, position: { x: 25, y: 114.2 }, style: { opacity: 0, width: 0, height: 0, pointerEvents: 'none' } },
      { id: '0', type: 'fsmNode', position: { x: 100, y: 100 }, data: { label: 'q0' } },
      { id: '1', type: 'fsmNode', position: { x: 300, y: 100 }, data: { label: 'q1', isFinal: true } },
    ],
    edges: [
      { id: 'start-edge', source: 'start-anchor', target: '0', type: 'default', markerEnd: { type: MarkerType.ArrowClosed, color: '#333' } },
      { id: 'e1', source: '0', target: '1', data: { label: 'a' }, ...defaultEdgeOptions },
    ],
  },
  {
    id: 2,
    description: 'Напишите регулярное выражение для этого автомата.',
    targetRegex: 'a*',
    nodes: [
      { id: 'start-anchor', type: 'input', sourcePosition: Position.Right, data: { label: '' }, position: { x: 25, y: 114.2 }, style: { opacity: 0, width: 0, height: 0, pointerEvents: 'none' } },
      { id: '0', type: 'fsmNode', position: { x: 100, y: 100 }, data: { label: 'q0', isFinal: true } },
    ],
    edges: [
      { id: 'start-edge', source: 'start-anchor', target: '0', type: 'default', markerEnd: { type: MarkerType.ArrowClosed, color: '#333' } },
      { ...defaultEdgeOptions, id: 'loop-0', source: '0', target: '0', type: 'selfloop', data: { label: 'a' }, sourceHandle: 'loop-source', targetHandle: 'loop-target' },
    ],
  },
  {
    id: 3,
    description: 'Напишите регулярное выражение для этого автомата.',
    targetRegex: 'a|b',
    nodes: [
      { id: 'start-anchor', type: 'input', sourcePosition: Position.Right, data: { label: '' }, position: { x: 25, y: 114.2 }, style: { opacity: 0, width: 0, height: 0, pointerEvents: 'none' } },
      { id: '0', type: 'fsmNode', position: { x: 100, y: 100 }, data: { label: 'q0' } },
      { id: '1', type: 'fsmNode', position: { x: 300, y: 100 }, data: { label: 'q1', isFinal: true } },
    ],
    edges: [
      { id: 'start-edge', source: 'start-anchor', target: '0', type: 'default', markerEnd: { type: MarkerType.ArrowClosed, color: '#333' } },
      { id: 'e1', source: '0', target: '1', data: { label: 'a,b' }, ...defaultEdgeOptions },
    ],
  }
];
