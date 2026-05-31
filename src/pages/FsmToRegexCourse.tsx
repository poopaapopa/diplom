import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react';
import FsmEditor from '../components/FsmEditor';
import { fsmToRegexCourse } from '../data/courses';
import './Course.scss';

export default function FsmToRegexCourse() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [userRegex, setUserRegex] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialPage, setTutorialPage] = useState(1);
  const [hasClosedTutorial, setHasClosedTutorial] = useState(false);
  const [showHintTooltip, setShowHintTooltip] = useState(false);

  const level = fsmToRegexCourse[currentLevelIndex];

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

  const handleCheck = () => {
    // Simple validation: check if user regex matches target regex.
    // Note: This is a naive check. In a real app, we might want to test equivalence.
    const cleanUser = userRegex.replace(/\s+/g, '');
    const cleanTarget = level.targetRegex.replace(/\s+/g, '');

    if (cleanUser === cleanTarget) {
      setIsCorrect(true);
      setIsVisible(true);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    } else {
      setIsCorrect(false);
      setIsVisible(true);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
  };

  const handleNext = () => {
    if (currentLevelIndex < fsmToRegexCourse.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setUserRegex('');
      setIsCorrect(null);
      setIsVisible(false);
      setTutorialPage(1);
      setShowTutorial(true);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    }
  };

  return (
    <div className="course-layout">
      <header className="course-header">
        <div className="header-left">
          <Link to="/" className="back-link">← На главную</Link>
          <h2>Уровень {currentLevelIndex + 1} из {fsmToRegexCourse.length}</h2>
        </div>
        <div className="task-description">
          <p>{level.description}</p>
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
          nodes={level.nodes}
          edges={level.edges}
          onNodesChange={() => {}}
          onEdgesChange={() => {}}
          setNodes={() => {}}
          setEdges={() => {}}
          readOnly={true}
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
              {currentLevelIndex < fsmToRegexCourse.length - 1 && (
                <button className="btn-next" onClick={handleNext}>Следующий уровень →</button>
              )}
            </>
          ) : (
            <span>Пока неверно. Попробуйте еще раз.</span>
          )}
        </div>

        <div className="floating-controls">
          <div className="regex-input-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
            <label style={{ fontWeight: 600, color: '#495057', whiteSpace: 'nowrap' }}>Ваш ответ:</label>
            <input
              type="text"
              value={userRegex}
              onChange={(e) => setUserRegex(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                fontSize: '1.2rem',
                borderRadius: '8px',
                border: '1px solid #ced4da',
                outline: 'none',
                minWidth: '300px'
              }}
              placeholder="Регулярное выражение..."
            />
          </div>
          <button className="btn-primary btn-large" onClick={handleCheck}>
            Проверить
            <Check size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
