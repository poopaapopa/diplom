import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Position, MarkerType } from '@xyflow/react';
import { Check, RotateCcw, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import FsmEditor from '../components/FsmEditor';
import { regexToFsmCourse } from '../data/courses';
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

const REGEX_META_CHARS = new Set(['(', ')', '|', '*', '+', '?']);

const getRegexAlphabet = (regex: string): string[] => {
  const alphabet = new Set<string>();

  for (const char of regex) {
    if (!REGEX_META_CHARS.has(char) && !/\s/.test(char)) {
      alphabet.add(char);
    }
  }

  return Array.from(alphabet);
};

const buildSampleStrings = (alphabet: string[], maxLength: number): string[] => {
  const samples: string[] = [''];

  const appendStrings = (prefix: string, remainingLength: number) => {
    if (remainingLength === 0) return;

    for (const char of alphabet) {
      const next = prefix + char;
      samples.push(next);
      appendStrings(next, remainingLength - 1);
    }
  };

  appendStrings('', maxLength);
  return samples;
};

const getEdgeSymbol = (edge: Edge): string => {
  const symbol = edge.data?.symbol ?? edge.data?.label ?? '';
  return String(symbol).trim() || 'ε';
};

const acceptsString = (nodes: Node[], edges: Edge[], input: string): boolean => {
  const initialState = nodes.find(n => n.data?.isInitial || n.id === '0' || n.id === 'q0');
  if (!initialState) return false;

  let currentStateId = initialState.id;

  for (const char of input) {
    const transition = edges.find(edge => {
      if (edge.id === 'start-edge' || edge.source !== currentStateId) return false;

      return getEdgeSymbol(edge)
        .split(',')
        .map(symbol => symbol.trim())
        .includes(char);
    });

    if (!transition) return false;
    currentStateId = transition.target;
  }

  return Boolean(nodes.find(node => node.id === currentStateId)?.data?.isFinal);
};

const validateFsmAgainstRegex = (nodes: Node[], edges: Edge[], regex: string): string | null => {
  const alphabet = getRegexAlphabet(regex);
  const maxLength = Math.max(8, regex.replace(/[()|*+?\s]/g, '').length + 3);
  const targetRegex = new RegExp(`^(?:${regex})$`);
  const samples = buildSampleStrings(alphabet, maxLength);

  for (const sample of samples) {
    const targetAccepts = targetRegex.test(sample);
    const fsmAccepts = acceptsString(nodes, edges, sample);

    if (targetAccepts !== fsmAccepts) {
      const displaySample = sample === '' ? 'пустую строку' : `"${sample}"`;
      return targetAccepts
        ? `Автомат должен принимать ${displaySample}.`
        : `Автомат не должен принимать ${displaySample}.`;
    }
  }

  return null;
};

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

    const validationError = validateFsmAgainstRegex(nodes, edges, level.regex);

    if (validationError) {
      showError(validationError);
      return;
    }

    setIsCorrect(true);
    setErrorMessage(null);
    setIsVisible(true);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
  };

  const handleNext = () => {
    if (currentLevelIndex < regexToFsmCourse.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setNodes(initialNodes);
      setEdges(initialEdges);
      setIsVisible(false);
      setTutorialPage(1);
      setShowTutorial(true);
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
          {level.tutorial && level.tutorial.length > 0 && (
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

      {level.tutorial && level.tutorial.length > 0 && (
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
              <span className="page-indicator">{tutorialPage} / {level.tutorial.length}</span>
              {tutorialPage < level.tutorial.length ? (
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
            {level.tutorial.map((page, index) => (
              <div key={index} style={{ display: tutorialPage === index + 1 ? 'block' : 'none' }}>
                <h3>{page.title}</h3>
                {page.content}
              </div>
            ))}
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
