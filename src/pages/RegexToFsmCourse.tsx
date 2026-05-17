import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Position, MarkerType } from '@xyflow/react';
import { Check, RotateCcw, ArrowRight, ArrowLeft, X, HelpCircle } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tutorialPage, setTutorialPage] = useState(1);
  const [hasClosedTutorial, setHasClosedTutorial] = useState(false);
  const [showHintTooltip, setShowHintTooltip] = useState(false);

  const level = regexToFsmCourse[currentLevelIndex];

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    if (!hasClosedTutorial) {
      setHasClosedTutorial(true);
      setShowHintTooltip(true);
      setTimeout(() => setShowHintTooltip(false), 5000);
    }
  };

  const toggleTutorial = () => {
    setShowTutorial(prev => {
      if (!prev) {
        setTutorialPage(1);
      }
      return !prev;
    });
    setShowHintTooltip(false);
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const showError = (msg: string) => {
    setIsCorrect(false);
    setErrorMessage(msg);
    setIsVisible(true);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  const handleCheck = () => {
    const finalNodes = nodes.filter(n => n.data?.isFinal);
    if (finalNodes.length === 0) {
      showError("Не добавлено конечное состояние");
      return;
    }

    const userEdges = edges.filter(e => e.id !== 'start-edge');
    if (userEdges.length === 0) {
      showError("Не добавлены переходы");
      return;
    }

    const generatedRegex = fsmToRegex(nodes, edges);

    if (generatedRegex === "Путь не найден") {
      showError("Нет пути от начального состояния к конечному");
      return;
    }

    // Simple validation: check if generated regex matches target regex
    // Note: This is a naive check. In a real app, we might want to test equivalence.
    // For now, we just remove spaces and compare.
    const cleanGenerated = generatedRegex.replace(/\s+/g, '');
    const cleanTarget = level.regex.replace(/\s+/g, '');
    
    if (cleanGenerated === cleanTarget) {
      setIsCorrect(true);
      setErrorMessage(null);
      setIsVisible(true);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    } else {
      showError("Автомат построен неверно. Попробуйте еще раз.");
    }
  };

  const handleNext = () => {
    if (currentLevelIndex < regexToFsmCourse.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setNodes(initialNodes);
      setEdges(initialEdges);
      setIsVisible(false);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    }
  };

  const handleReset = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsVisible(false);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
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
        <div className="header-right">
          {currentLevelIndex === 0 && (
            <div className="tutorial-toggle-container">
              {showHintTooltip && (
                <div className="tutorial-hint-tooltip">
                  Подсказки всегда можно глянуть здесь
                </div>
              )}
              <button
                className={`tutorial-toggle-btn ${showHintTooltip ? 'pulsing' : ''}`}
                onClick={toggleTutorial}
                title="Показать подсказки"
              >
                <HelpCircle size={24} />
              </button>
            </div>
          )}
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

      {currentLevelIndex === 0 && (
        <div className={`tutorial-sidebar ${showTutorial ? 'open' : 'closed'}`}>
          <div className="tutorial-header">
            <div className="tutorial-controls">
              <button
                className="btn-prev-page"
                onClick={() => setTutorialPage(prev => Math.max(1, prev - 1))}
                disabled={tutorialPage === 1}
              >
                <ArrowLeft size={20} />
              </button>
              <span className="page-indicator">{tutorialPage} / 4</span>
              {tutorialPage < 4 ? (
                <button className="btn-next-page" onClick={() => setTutorialPage(prev => prev + 1)}>
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button className="btn-primary btn-finish" onClick={handleCloseTutorial}>
                  Понятно
                </button>
              )}
            </div>
          </div>
          <div className="tutorial-content">
            {tutorialPage === 1 && (
              <>
                <h3>Конечные автоматы</h3>
                <p>
                  <strong>Конечный автомат</strong> — это математическая модель, которая читает строку символ за символом и в конце решает, подходит ли эта строка под заданное правило или нет.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                  <svg width="280" height="60" viewBox="0 0 280 60">
                    <line x1="0" y1="30" x2="15" y2="30" stroke="#333" strokeWidth="2" />
                    <polygon points="15,25 25,30 15,35" fill="#333" />
                    
                    <circle cx="40" cy="30" r="14" fill="white" stroke="#222" strokeWidth="2" />
                    <text x="40" y="34" fontSize="11" textAnchor="middle" fill="#222" fontWeight="bold">q0</text>
                    
                    <line x1="54" y1="30" x2="90" y2="30" stroke="#333" strokeWidth="2" />
                    <polygon points="90,25 100,30 90,35" fill="#333" />
                    <text x="77" y="24" fontSize="12" textAnchor="middle" fill="#333">a</text>
                    
                    <circle cx="115" cy="30" r="14" fill="white" stroke="#222" strokeWidth="2" />
                    <text x="115" y="34" fontSize="11" textAnchor="middle" fill="#222" fontWeight="bold">q1</text>
                    
                    <line x1="129" y1="30" x2="165" y2="30" stroke="#333" strokeWidth="2" />
                    <polygon points="165,25 175,30 165,35" fill="#333" />
                    <text x="152" y="24" fontSize="12" textAnchor="middle" fill="#333">b</text>
                    
                    <circle cx="190" cy="30" r="14" fill="white" stroke="#222" strokeWidth="2" />
                    <text x="190" y="34" fontSize="11" textAnchor="middle" fill="#222" fontWeight="bold">q2</text>

                    <line x1="204" y1="30" x2="240" y2="30" stroke="#333" strokeWidth="2" />
                    <polygon points="240,25 250,30 240,35" fill="#333" />
                    <text x="227" y="24" fontSize="12" textAnchor="middle" fill="#333">c</text>

                    <circle cx="265" cy="30" r="14" fill="white" stroke="#222" strokeWidth="2" />
                    <circle cx="265" cy="30" r="10" fill="none" stroke="#222" strokeWidth="2" />
                    <text x="265" y="34" fontSize="11" textAnchor="middle" fill="#222" fontWeight="bold">q3</text>
                  </svg>
                </div>
              </>
            )}
            {tutorialPage === 2 && (
              <>
                <h3>Элементы автомата</h3>
                <p>
                  Формально автомат состоит из <strong>состояний</strong> и <strong>переходов</strong> между ними.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0, marginRight: '12px' }}>
                    <circle cx="20" cy="20" r="16" fill="white" stroke="#222" strokeWidth="2" />
                    <text x="20" y="24" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q0</text>
                  </svg>
                  <p style={{ margin: 0 }}>
                    <strong>Состояние</strong> — это положение, в котором находится автомат после прочтения части строки. Автомат всегда начинает работу со <em>стартового состояния</em>.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0, marginRight: '12px' }}>
                    <circle cx="20" cy="20" r="16" fill="white" stroke="#222" strokeWidth="2" />
                    <circle cx="20" cy="20" r="12" fill="none" stroke="#222" strokeWidth="2" />
                    <text x="20" y="24" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q1</text>
                  </svg>
                  <p style={{ margin: 0 }}>
                    <strong>Конечное состояние</strong> — необходимое каждому конечному автомату состояние. Если после прочтения всей строки автомат оказывается в нём, строка считается <em>допустимой</em>.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="40" height="20" viewBox="0 0 40 20" style={{ flexShrink: 0, marginRight: '12px' }}>
                    <line x1="0" y1="10" x2="30" y2="10" stroke="#333" strokeWidth="2" />
                    <polygon points="30,5 40,10 30,15" fill="#333" />
                    <text x="20" y="8" fontSize="10" textAnchor="middle" fill="#333">a</text>
                  </svg>
                  <p style={{ margin: 0 }}>
                    <strong>Переход</strong> — показывает, в какое состояние перейдет автомат при чтении определенного символа.
                  </p>
                </div>
              </>
            )}
            {tutorialPage === 3 && (
              <>
                <h3>Виды автоматов</h3>
                <ul className="tutorial-list">
                <li><strong>ДКА (Детерминированные)</strong> — из каждого состояния по каждому символу есть ровно один переход.</li>
                <li><strong>НКА (Недетерминированные)</strong> — может быть несколько переходов по одному символу или ни одного.</li>
                <li><strong>ε-НКА</strong> — НКА, в котором возможны переходы по пустой строке (ε-переходы) без чтения символа.</li>
                </ul>
                <p style={{ marginTop: '12px' }}>
                  В этом курсе мы будем строить именно <strong>ДКА</strong>.
                </p>
              </>
            )}
            {tutorialPage === 4 && (
              <>
                <h3>Управление редактором</h3>
                <ul className="tutorial-list">
                  <li><strong>Добавить состояние:</strong> Двойной клик по пустому месту.</li>
                  <li><strong>Добавить переход:</strong> Потяните от точки справа одного состояния к точки слева другого.</li>
                  <li><strong>Изменить переход:</strong> Кликните по текстовому полю сверху от перехода.</li>
                  <li><strong>Добавить/удалить конечное состояние:</strong> Двойной клик по состоянию.</li>
                  <li><strong>Удалить состояние:</strong> Кликните на состояние и нажмите Backspace.</li>
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      <div className="floating-controls-container">
        <div className={`feedback ${isCorrect ? 'success' : 'error'} ${isVisible ? 'visible' : ''}`}>
          {isCorrect ? (
            <>
              <span>Верно! Отличная работа.</span>
              {currentLevelIndex < regexToFsmCourse.length - 1 && (
                <button className="btn-next" onClick={handleNext}>Следующий уровень →</button>
              )}
            </>
          ) : (
            <span>{errorMessage || "Пока неверно. Попробуйте еще раз."}</span>
          )}
        </div>

        <div className="floating-controls">
          <button className="btn-secondary btn-large" onClick={handleReset}>
            Сбросить
            <RotateCcw size={20} />
          </button>
          <button className="btn-primary btn-large" onClick={handleCheck}>
            Проверить
            <Check size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
