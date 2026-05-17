import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Position, MarkerType } from '@xyflow/react';
import FsmEditor from '../components/FsmEditor';
import { regexToFsmCourse } from '../data/courses';
import { fsmToRegex } from '../utils/convertToRegex';
import './Course.scss';

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

export default function RegexToFsmCourse() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const level = regexToFsmCourse[currentLevelIndex];

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleCheck = () => {
    const generatedRegex = fsmToRegex(nodes, edges);
    // Simple validation: check if generated regex matches target regex
    // Note: This is a naive check. In a real app, we might want to test equivalence.
    // For now, we just remove spaces and compare.
    const cleanGenerated = generatedRegex.replace(/\s+/g, '');
    const cleanTarget = level.regex.replace(/\s+/g, '');
    
    if (cleanGenerated === cleanTarget) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const handleNext = () => {
    if (currentLevelIndex < regexToFsmCourse.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setNodes(initialNodes);
      setEdges(initialEdges);
      setIsCorrect(null);
    }
  };

  const handleReset = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsCorrect(null);
  };

  return (
    <div className="course-layout">
      <header className="course-header">
        <div className="header-left">
          <Link to="/" className="back-link">← На главную</Link>
          <h2>Уровень {currentLevelIndex + 1} из {regexToFsmCourse.length}</h2>
        </div>
        <div className="task-description">
          <p>{level.description}</p>
          <div className="target-regex">
            Цель: <strong>{level.regex}</strong>
          </div>
        </div>
      </header>

      <div className="editor-container">
        <FsmEditor
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes}
          setEdges={setEdges}
        />
      </div>

      <footer className="course-footer">
        <div className="controls">
          <button className="btn-secondary" onClick={handleReset}>Сбросить</button>
          <button className="btn-primary" onClick={handleCheck}>Проверить</button>
        </div>
        
        {isCorrect !== null && (
          <div className={`feedback ${isCorrect ? 'success' : 'error'}`}>
            {isCorrect ? (
              <>
                <span>Верно! Отличная работа.</span>
                {currentLevelIndex < regexToFsmCourse.length - 1 && (
                  <button className="btn-next" onClick={handleNext}>Следующий уровень →</button>
                )}
              </>
            ) : (
              <span>Пока неверно. Попробуйте еще раз.</span>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
