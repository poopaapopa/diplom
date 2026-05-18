import { useState } from 'react';
import { Link } from 'react-router-dom';
import FsmEditor from '../components/FsmEditor';
import { fsmToRegexCourse } from '../data/courses';
import './Course.scss';

export default function FsmToRegexCourse() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [userRegex, setUserRegex] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const level = fsmToRegexCourse[currentLevelIndex];

  const handleCheck = () => {
    // Simple validation: check if user regex matches target regex
    // Note: This is a naive check. In a real app, we might want to test equivalence.
    const cleanUser = userRegex.replace(/\s+/g, '');
    const cleanTarget = level.targetRegex.replace(/\s+/g, '');
    
    if (cleanUser === cleanTarget) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const handleNext = () => {
    if (currentLevelIndex < fsmToRegexCourse.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setUserRegex('');
      setIsCorrect(null);
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

      <footer className="course-footer">
        <div className="regex-input-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
          <label style={{ fontWeight: 600, color: '#495057' }}>Ваш ответ:</label>
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
              outline: 'none'
            }}
            placeholder="Введите регулярное выражение..."
          />
        </div>

        <div className="controls" style={{ marginLeft: '2rem' }}>
          <button className="btn-primary" onClick={handleCheck}>Проверить</button>
        </div>
        
        {isCorrect !== null && (
          <div className={`feedback ${isCorrect ? 'success' : 'error'}`} style={{ marginLeft: '1rem' }}>
            {isCorrect ? (
              <>
                <span>Верно!</span>
                {currentLevelIndex < fsmToRegexCourse.length - 1 && (
                  <button className="btn-next" onClick={handleNext}>Следующий уровень →</button>
                )}
              </>
            ) : (
              <span>Пока неверно.</span>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
