import { Node, Edge } from '@xyflow/react';

export const fsmToRegex = (nodes: Node[], edges: Edge[]): string => {
  const initialState = nodes.find(n => n.data?.isInitial || n.id === '0');
  const finalNodes = nodes.filter(n => n.data?.isFinal);

  if (!initialState) return "Ошибка: Начальный узел (id: 0) не найден";
  if (finalNodes.length === 0) return "Ошибка: Нет финальных (двойных) состояний";

  let L: Record<string, Record<string, string>> = {};

  const add = (u: string, v: string, exp: string) => {
    if (!exp) exp = 'ε';
    if (!L[u]) L[u] = {};
    L[u][v] = L[u][v] ? simplifyOr(L[u][v], exp) : exp;
  };

  edges.forEach(edge => {
    add(edge.source, edge.target, edge.data?.symbol as string || '');
  });

  const S = 'V_START', E = 'V_END';
  add(S, initialState.id, 'ε');
  finalNodes.forEach(f => add(f.id, E, 'ε'));

  // Удаляем узлы в порядке возрастания связей (эвристика для коротких путей)
  const stateIds = nodes.map(n => n.id).sort((a, b) => {
    const dA = edges.filter(e => e.source === a || e.target === a).length;
    const dB = edges.filter(e => e.source === b || e.target === b).length;
    return dA - dB;
  });

  for (const k of stateIds) {
    const precursors = Object.keys(L).filter(i => i !== k && L[i][k]);
    const successors = Object.keys(L[k] || {}).filter(j => j !== k);

    for (const i of precursors) {
      for (const j of successors) {
        const Rik = L[i][k];
        const Rkj = L[k][j];
        const Rkk = L[k][k];
        const Rij = L[i][j];

        const pathThroughK = simplifyConcat(simplifyConcat(Rik, simplifyStar(Rkk)), Rkj);
        L[i][j] = Rij ? simplifyOr(Rij, pathThroughK) : pathThroughK;
      }
    }
    delete L[k];
    Object.values(L).forEach(row => delete row[k]);
  }

  const res = L[S]?.[E] || "";
  if (!res) return "Ошибка: Путь к финальному состоянию невозможен";

  return cleanRegex(res);
};

// --- МОЩНАЯ АЛГЕБРА УПРОЩЕНИЙ ---

function simplifyOr(a: string, b: string): string {
  if (a === b) return a;
  if (!a || a === 'ε') return b.includes('ε') ? b : (b ? b + '|ε' : 'ε');
  if (!b || b === 'ε') return a.includes('ε') ? a : (a ? a + '|ε' : 'ε');

  const terms = new Set([...a.split('|'), ...b.split('|')]);
  const sorted = Array.from(terms).filter(t => t !== '').sort();
  return sorted.join('|');
}

function simplifyConcat(a: string, b: string): string {
  if (!a || a === 'ε') return b;
  if (!b || b === 'ε') return a;

  const baseA = strip(a);
  const baseB = strip(b);

  // Логика Плюса: a . a* -> a+
  if (baseB.endsWith('*') && baseA === baseB.slice(0, -1)) return wrap(baseA) + '+';
  // a* . a -> a+
  if (baseA.endsWith('*') && baseB === baseA.slice(0, -1)) return wrap(baseB) + '+';

  return wrapForConcat(a) + wrapForConcat(b);
}

function simplifyStar(a: string): string {
  if (!a || a === 'ε') return '';

  // (a|ba)* -> a*(ba+)*
  if (a.includes('|')) {
    const parts = a.split('|');
    if (parts.length === 2) {
      const [p, q] = parts;
      if (q.startsWith(p)) return `${simplifyStar(p)}(${q.slice(p.length)}${wrap(p)}+)*`;
      if (q.endsWith(p)) return `${simplifyStar(p)}(${q.slice(0, -p.length)}${wrap(p)}+)*`;
    }
  }

  if (a.endsWith('*')) return a;
  if (a.endsWith('+')) return a.slice(0, -1) + '*';
  return wrapForStar(a) + '*';
}

// Удаление лишних скобок для сравнения
function strip(s: string): string {
  if (s.startsWith('(') && s.endsWith(')')) return s.slice(1, -1);
  return s;
}

function wrapForConcat(s: string): string {
  if (!s || s === 'ε' || s.length === 1) return s;
  if (s.startsWith('(') && s.endsWith(')')) return s;
  if (s.length === 2 && (s.endsWith('*') || s.endsWith('+'))) return s;
  if (s.includes('|')) return `(${s})`;
  return s;
}

function wrapForStar(s: string): string {
  if (!s || s === 'ε' || s.length === 1) return s;
  if (s.startsWith('(') && s.endsWith(')')) return s;
  if (s.length === 2 && (s.endsWith('*') || s.endsWith('+'))) return s;
  return `(${s})`;
}

function wrap(s: string): string {
  return wrapForStar(s);
}

function cleanRegex(re: string): string {
  let cleaned = re.replace(/ε/g, '');

  // 1. Финальный поиск паттернов aa* -> a+
  // Ищем одиночные символы: a a*
  cleaned = cleaned.replace(/([a-zA-Z0-9])\1\*/g, '$1+');
  // Ищем группы в скобках: (abc)(abc)*
  cleaned = cleaned.replace(/\(([^)]+)\)\(\1\)\*/g, '($1)+');

  // 2. Убираем лишние скобки вокруг одиночных символов
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned.replace(/\(([^|+*()]+)\)([*+])?/g, (match, p1, p2) => {
      if (p1.length === 1 || (p1.length === 2 && (p1.endsWith('*') || p1.endsWith('+')))) {
        return p1 + (p2 || '');
      }
      return match;
    });
  }

  // 3. Убираем двойные скобки
  cleaned = cleaned.replace(/\(\((.*?)\)\)/g, '($1)');

  return cleaned || 'ε';
}