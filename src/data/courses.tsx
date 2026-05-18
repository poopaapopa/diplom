import React from 'react';
import { Node, Edge, MarkerType, Position } from '@xyflow/react';

export interface TutorialPage {
  title: string;
  content: React.ReactNode;
}

export interface RegexToFsmLevel {
  id: number;
  regex: string;
  description: string;
  tutorial?: TutorialPage[];
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
    regex: 'mama',
    description: 'Постройте автомат, принимающий только строку "mama".',
    tutorial: [
      {
        title: 'Конечные автоматы',
        content: (
          <>
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
                <text x="77" y="24" fontSize="12" textAnchor="middle" fill="#333">m</text>
                
                <circle cx="115" cy="30" r="14" fill="white" stroke="#222" strokeWidth="2" />
                <text x="115" y="34" fontSize="11" textAnchor="middle" fill="#222" fontWeight="bold">q1</text>
                
                <line x1="129" y1="30" x2="165" y2="30" stroke="#333" strokeWidth="2" />
                <polygon points="165,25 175,30 165,35" fill="#333" />
                <text x="152" y="24" fontSize="12" textAnchor="middle" fill="#333">a</text>
                
                <circle cx="190" cy="30" r="14" fill="white" stroke="#222" strokeWidth="2" />
                <text x="190" y="34" fontSize="11" textAnchor="middle" fill="#222" fontWeight="bold">q2</text>

                <line x1="204" y1="30" x2="240" y2="30" stroke="#333" strokeWidth="2" />
                <polygon points="240,25 250,30 240,35" fill="#333" />
                <text x="227" y="24" fontSize="12" textAnchor="middle" fill="#333">m</text>

                <circle cx="265" cy="30" r="14" fill="white" stroke="#222" strokeWidth="2" />
                <circle cx="265" cy="30" r="10" fill="none" stroke="#222" strokeWidth="2" />
                <text x="265" y="34" fontSize="11" textAnchor="middle" fill="#222" fontWeight="bold">q3</text>
              </svg>
            </div>
          </>
        )
      },
      {
        title: 'Элементы автомата',
        content: (
          <>
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
        )
      },
      {
        title: 'Виды автоматов',
        content: (
          <>
            <ul className="tutorial-list">
            <li><strong>ДКА (Детерминированные)</strong> — из каждого состояния по каждому символу есть ровно один переход.</li>
            <li><strong>НКА (Недетерминированные)</strong> — может быть несколько переходов по одному символу или ни одного.</li>
            <li><strong>ε-НКА</strong> — НКА, в котором возможны переходы по пустой строке (ε-переходы) без чтения символа.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              В этом курсе мы будем строить именно <strong>ДКА</strong>.
            </p>
          </>
        )
      },
      {
        title: 'Управление редактором',
        content: (
          <>
            <ul className="tutorial-list">
              <li><strong>Добавить состояние:</strong> Двойной клик по пустому месту.</li>
              <li><strong>Добавить переход:</strong> Потяните от точки справа одного состояния к точки слева другого.</li>
              <li><strong>Изменить переход:</strong> Кликните по текстовому полю сверху от перехода.</li>
              <li><strong>Добавить/удалить конечное состояние:</strong> Двойной клик по состоянию.</li>
              <li><strong>Удалить состояние:</strong> Кликните на состояние и нажмите Backspace.</li>
            </ul>
          </>
        )
      }
    ]
  },
  {
    id: 2,
    regex: 'ma*',
    description: 'Постройте автомат для "ma*", принимающий "m", "ma", "maa" и т.д.',
    tutorial: [
      {
        title: 'Регулярные выражения',
        content: (
          <>
            <p>
              <strong>Регулярное выражение</strong> — это компактная запись правила, по которому можно описать целое множество строк.
            </p>
            <p>
              Например, выражение <code>ma*</code> задаёт строки, которые начинаются с <code>m</code>, а затем содержат ноль или больше букв <code>a</code>: <code>m</code>, <code>ma</code>, <code>maa</code> и так далее.
            </p>
            <p>
              Регулярные выражения бывают простыми, когда они описывают одну точную строку, и составными, когда в них используются операторы повторения, выбора и группировки.
            </p>
          </>
        )
      },
      {
        title: 'Из чего состоят и где используются',
        content: (
          <>
            <p>
              Регулярное выражение строится из <strong>обычных символов</strong> и <strong>специальных операторов</strong>.
            </p>
            <ul className="tutorial-list">
              <li><strong>Символы</strong>, например <code>a</code> или <code>m</code>, должны встретиться в строке буквально.</li>
              <li><strong>Операторы повторения</strong>, например <code>*</code>, <code>+</code> и <code>?</code>, задают количество повторов.</li>
              <li><strong>Операторы выбора и группировки</strong>, например <code>|</code> и <code>()</code>, помогают описывать альтернативы и сложные части шаблона.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              Регулярные выражения используют для поиска текста, проверки форматов вроде email или номера телефона, подсветки синтаксиса и обработки данных в программах.
            </p>
          </>
        )
      },
      {
        title: 'Звезда Клини (*)',
        content: (
          <>
            <p>
              <strong>Звезда Клини (символ *)</strong> — это оператор в регулярных выражениях, который означает, что предшествующий ему символ может повторяться <strong>ноль или более раз</strong>.
            </p>
            <p>
              Например, регулярное выражение <code>a*</code> соответствует строкам:
            </p>
            <ul className="tutorial-list">
              <li><em>(пустая строка)</em> — 0 повторений</li>
              <li><code>a</code> — 1 повторение</li>
              <li><code>aa</code> — 2 повторения</li>
              <li><code>aaaaa</code> — 5 повторений</li>
            </ul>
          </>
        )
      },
      {
        title: 'Как построить цикл?',
        content: (
          <>
            <p>
              В конечном автомате повторение одного и того же символа реализуется с помощью <strong>петли (self-loop)</strong> — перехода из состояния в само себя.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="50" y="54" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q1</text>
                <path d="M 40 38 C 20 10, 80 10, 60 38" fill="none" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="50" y="15" fontSize="12" textAnchor="middle" fill="#333">a</text>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#333" />
                  </marker>
                </defs>
              </svg>
            </div>
            <p>
              В нашем редакторе, чтобы создать петлю, просто кликните на <strong>узел сверху состояния</strong>.
            </p>
          </>
        )
      }
    ]
  },
  {
    id: 3,
    regex: 'cat|dog',
    description: 'Постройте автомат, принимающий либо строку "cat", либо "dog".',
    tutorial: [
      {
        title: 'Оператор ИЛИ (|)',
        content: (
          <>
            <p>
              <strong>Оператор альтернативы (|)</strong> позволяет задать выбор между несколькими вариантами. Это эквивалентно логическому "ИЛИ".
            </p>
            <p>
              Например, регулярное выражение <code>cat|dog</code> означает, что строка должна быть либо в точности <code>cat</code>, либо в точности <code>dog</code>.
            </p>
          </>
        )
      },
      {
        title: 'Ветвление в автомате',
        content: (
          <>
            <p>
              Чтобы реализовать выбор в конечном автомате, необходимо создать <strong>ветвление</strong>. Из одного состояния (например, стартового) будут выходить несколько переходов по разным символам.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
              <svg width="200" height="120" viewBox="0 0 200 120">
                <circle cx="40" cy="60" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="40" y="64" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q0</text>
                
                <line x1="54" y1="52" x2="120" y2="25" stroke="#333" strokeWidth="2" />
                <polygon points="120,20 128,22 118,30" fill="#333" />
                <text x="80" y="30" fontSize="12" textAnchor="middle" fill="#333">c</text>
                
                <circle cx="140" cy="20" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="140" y="24" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q1</text>

                <line x1="54" y1="68" x2="120" y2="95" stroke="#333" strokeWidth="2" />
                <polygon points="118,90 128,98 120,100" fill="#333" />
                <text x="80" y="95" fontSize="12" textAnchor="middle" fill="#333">d</text>
                
                <circle cx="140" cy="100" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="140" y="104" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q2</text>
              </svg>
            </div>
            <p>
              Если первый символ строки — 'c', автомат пойдет по верхнему пути. Если 'd' — по нижнему.
            </p>
          </>
        )
      }
    ]
  },
  {
    id: 4,
    regex: '(ha)*',
    description: 'Постройте автомат, принимающий пустую строку, "ha", "haha", "hahaha" и т.д.',
    tutorial: [
      {
        title: 'Группировка ()',
        content: (
          <>
            <p>
              <strong>Круглые скобки ()</strong> используются для группировки символов. Это позволяет применять операторы (например, <code>*</code> или <code>|</code>) не к одному символу, а к целой последовательности.
            </p>
            <p>
              Сравните:
            </p>
            <ul className="tutorial-list">
              <li><code>ha*</code> — буква 'h', за которой следует ноль или более букв 'a' (h, ha, haa, haaa).</li>
              <li><code>(ha)*</code> — последовательность 'ha' повторяется ноль или более раз (пусто, ha, haha, hahaha).</li>
            </ul>
          </>
        )
      },
      {
        title: 'Цикл через несколько состояний',
        content: (
          <>
            <p>
              Для выражения <code>(ha)*</code> простая петля (self-loop) не подойдет, так как нам нужно прочитать два разных символа по очереди.
            </p>
            <p>
              Решение — создать цикл, который проходит через несколько состояний и возвращается обратно.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
              <svg width="200" height="80" viewBox="0 0 200 80">
                <circle cx="50" cy="40" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <circle cx="50" cy="40" r="12" fill="none" stroke="#222" strokeWidth="2" />
                <text x="50" y="44" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q0</text>
                
                <path d="M 66 30 Q 100 10 134 30" fill="none" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="100" y="15" fontSize="12" textAnchor="middle" fill="#333">h</text>
                
                <circle cx="150" cy="40" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="150" y="44" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q1</text>

                <path d="M 134 50 Q 100 70 66 50" fill="none" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="100" y="75" fontSize="12" textAnchor="middle" fill="#333">a</text>
              </svg>
            </div>
            <p>
              Обратите внимание, что стартовое состояние также должно быть конечным, чтобы принимать пустую строку (0 повторений).
            </p>
          </>
        )
      }
    ]
  },
  {
    id: 5,
    regex: 'colou?r',
    description: 'Постройте автомат, принимающий как "color", так и "colour".',
    tutorial: [
      {
        title: 'Опциональность (?)',
        content: (
          <>
            <p>
              <strong>Символ вопроса (?)</strong> делает предшествующий символ <strong>необязательным</strong>. Это означает, что символ может встретиться 0 или 1 раз.
            </p>
            <p>
              Выражение <code>colou?r</code> совпадает со словами:
            </p>
            <ul className="tutorial-list">
              <li><code>color</code> (буквы 'u' нет, 0 повторений)</li>
              <li><code>colour</code> (буква 'u' есть, 1 повторение)</li>
            </ul>
          </>
        )
      },
      {
        title: 'Пропуск состояния',
        content: (
          <>
            <p>
              В автомате опциональность реализуется добавлением дополнительного перехода, который "перепрыгивает" необязательный символ.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
              <svg width="240" height="100" viewBox="0 0 240 100">
                <circle cx="40" cy="60" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="40" y="64" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q3</text>
                
                <line x1="56" y1="60" x2="104" y2="60" stroke="#333" strokeWidth="2" />
                <polygon points="104,55 114,60 104,65" fill="#333" />
                <text x="85" y="54" fontSize="12" textAnchor="middle" fill="#333">u</text>
                
                <circle cx="130" cy="60" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="130" y="64" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q4</text>

                <line x1="146" y1="60" x2="194" y2="60" stroke="#333" strokeWidth="2" />
                <polygon points="194,55 204,60 194,65" fill="#333" />
                <text x="175" y="54" fontSize="12" textAnchor="middle" fill="#333">r</text>
                
                <circle cx="220" cy="60" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="220" y="64" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q5</text>

                <path d="M 48 46 Q 130 0 212 46" fill="none" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="130" y="20" fontSize="12" textAnchor="middle" fill="#333">r</text>
              </svg>
            </div>
            <p>
              Из состояния перед 'u' мы можем пойти по 'u' в следующее состояние, либо сразу пойти по 'r', пропустив 'u'.
            </p>
          </>
        )
      }
    ]
  },
  {
    id: 6,
    regex: 'go+gle',
    description: 'Постройте автомат для "gogle", "google", "gooogle" и т.д.',
    tutorial: [
      {
        title: 'Одно или более повторений (+)',
        content: (
          <>
            <p>
              <strong>Символ плюс (+)</strong> означает, что предшествующий символ должен повториться <strong>один или более раз</strong>.
            </p>
            <p>
              Главное отличие от <code>*</code> в том, что символ <strong>обязан</strong> встретиться хотя бы один раз.
            </p>
            <ul className="tutorial-list">
              <li><code>go+gle</code> совпадает с <code>gogle</code>, <code>google</code>, <code>gooogle</code>.</li>
              <li>Но <strong>не совпадает</strong> с <code>ggle</code> (0 букв 'o').</li>
            </ul>
          </>
        )
      },
      {
        title: 'Обязательный переход и петля',
        content: (
          <>
            <p>
              Чтобы реализовать <code>+</code> в автомате, нужно скомбинировать обычный переход (для первого обязательного символа) и петлю (для всех последующих).
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
              <svg width="200" height="100" viewBox="0 0 200 100">
                <circle cx="40" cy="60" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="40" y="64" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q1</text>
                
                <line x1="56" y1="60" x2="124" y2="60" stroke="#333" strokeWidth="2" />
                <polygon points="124,55 134,60 124,65" fill="#333" />
                <text x="95" y="54" fontSize="12" textAnchor="middle" fill="#333">o</text>
                
                <circle cx="150" cy="60" r="16" fill="white" stroke="#222" strokeWidth="2" />
                <text x="150" y="64" fontSize="12" textAnchor="middle" fill="#222" fontWeight="bold">q2</text>

                <path d="M 140 48 C 120 20, 180 20, 160 48" fill="none" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="150" y="25" fontSize="12" textAnchor="middle" fill="#333">o</text>
              </svg>
            </div>
            <p>
              Сначала мы обязательно переходим по 'o' в новое состояние, а уже в нем делаем петлю по 'o' для дополнительных букв.
            </p>
          </>
        )
      }
    ]
  },
  {
    id: 7,
    regex: '(a|b)*abb',
    description: 'Постройте автомат, принимающий любые строки из "a" и "b", которые заканчиваются на "abb".',
    tutorial: [
      {
        title: 'Финальное испытание',
        content: (
          <>
            <p>
              Выражение <code>(a|b)*abb</code> — это классическая задача из теории автоматов. Оно описывает язык всех строк, состоящих из букв 'a' и 'b', которые <strong>заканчиваются на подстроку "abb"</strong>.
            </p>
            <p>
              Здесь вам предстоит объединить всё, что вы узнали:
            </p>
            <ul className="tutorial-list">
              <li>Группировку и альтернативу <code>(a|b)</code></li>
              <li>Звезду Клини <code>*</code> для зацикливания</li>
              <li>Конкатенацию для суффикса <code>abb</code></li>
            </ul>
          </>
        )
      },
      {
        title: 'Подсказка по построению',
        content: (
          <>
            <p>
              Поскольку мы строим <strong>детерминированный</strong> автомат (ДКА), вам нужно тщательно продумать переходы.
            </p>
            <p>
              Начните с базовой цепочки для <code>abb</code>. Затем подумайте: что должно происходить, если в процессе чтения <code>abb</code> мы встречаем "неправильный" символ?
            </p>
            <p>
              Например, если мы прочитали <code>ab</code> и ждем вторую <code>b</code>, но приходит <code>a</code> — куда должен вернуться автомат? (Подсказка: мы только что прочитали <code>a</code>, значит мы можем начать искать <code>abb</code> заново с этого места).
            </p>
          </>
        )
      }
    ]
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
