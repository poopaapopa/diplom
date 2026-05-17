import React from 'react';
import { Link } from 'react-router-dom';
import { Regex, GitGraph, Play } from 'lucide-react';
import './MainMenu.scss';

export default function MainMenu() {
  return (
    <div className="main-menu">
      <div className="animated-background">
        <ul className="circles">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      </div>

      <div className="content-wrapper">
        <header className="menu-header">
          <h1>Конечные автоматы и регулярные выражения</h1>
          <p>Интерактивный курс для изучения связи между ДКА и регулярными выражениями</p>
        </header>

        <div className="cards-container">
        <Link to="/regex-to-fsm" className="menu-card">
          <div className="card-icon">
            <GitGraph size={48} />
          </div>
          <h2>Регулярка → Автомат</h2>
          <p>Научитесь строить детерминированные конечные автоматы по заданным регулярным выражениям.</p>
          <div className="card-action">
            <span>Начать</span>
            <Play size={20} />
          </div>
        </Link>

        <Link to="/fsm-to-regex" className="menu-card">
          <div className="card-icon">
            <Regex size={48} />
          </div>
          <h2>Автомат → Регулярка</h2>
          <p>Тренируйтесь составлять регулярные выражения, описывающие язык заданного автомата.</p>
          <div className="card-action">
            <span>Начать</span>
            <Play size={20} />
          </div>
        </Link>

        <Link to="/sandbox" className="menu-card sandbox-card">
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <h2>Песочница</h2>
          <p>Свободный режим для экспериментов с автоматами и регулярными выражениями.</p>
          <div className="card-action">
            <span>Открыть</span>
            <Play size={20} />
          </div>
        </Link>
        </div>
      </div>
    </div>
  );
}
