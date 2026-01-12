import { Node, Edge } from '@xyflow/react';

export const fsmToRegex = (nodes: Node[], edges: Edge[]): string => {
  const initialState = nodes.find(n => n.data?.isInitial || n.id === '0' || n.id === 'q0');
  const finalNodes = nodes.filter(n => n.data?.isFinal);

  if (!initialState) return "Начните с создания начального узла";
  if (finalNodes.length === 0) return "Сделайте хотя бы один узел конечным";

  let L: Record<string, Record<string, string>> = {};

  const add = (u: string, v: string, exp: string) => {
    if (!exp || exp === '') exp = 'ε';
    if (!L[u]) L[u] = {};
    L[u][v] = L[u][v] ? simplifyOr(L[u][v], exp) : exp;
  };

  edges.forEach(edge => {
    add(edge.source, edge.target, (edge.data?.symbol as string) || 'ε');
  });

  const S = 'V_START', E = 'V_END';
  add(S, initialState.id, 'ε');
  finalNodes.forEach(f => add(f.id, E, 'ε'));

  const stateIds = nodes.map(n => n.id).filter(id => id !== S && id !== E);

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
  return res ? cleanRegex(res) : "Путь не найден";
};

// --- ТОКЕНИЗАЦИЯ ---
// Разбивает строку на блоки: 'a+', '1', '(a|b)*', 'bb' -> ['a+', '1', '(a|b)*', 'b', 'b']
function getTokens(s: string): string[] {
  if (s === 'ε' || s === '') return [];
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    let token = "";
    if (s[i] === '(') {
      let balance = 1;
      let start = i;
      i++;
      while (i < s.length && balance > 0) {
        if (s[i] === '(') balance++;
        if (s[i] === ')') balance--;
        i++;
      }
      token = s.slice(start, i);
    } else {
      token = s[i];
      i++;
    }
    // Захватываем квантификаторы *, + за токеном
    while (i < s.length && (s[i] === '*' || s[i] === '+')) {
      token += s[i];
      i++;
    }
    tokens.push(token);
  }
  return tokens;
}

// --- УПРОЩЕНИЕ OR ---
function simplifyOr(a: string, b: string): string {
  if (a === b) return a;
  if (!a || a === '∅' || a === 'ε') return (b && b !== '∅') ? b : 'ε';
  if (!b || b === '∅' || b === 'ε') return (a && a !== '∅') ? a : 'ε';

  const terms = Array.from(new Set([...splitByOr(a), ...splitByOr(b)]))
    .filter(t => t !== '∅');

  if (terms.length === 1) return terms[0];

  return factorize(terms);
}

function factorize(terms: string[]): string {
  if (terms.length <= 1) return terms[0] || 'ε';

  const tokenized = terms.map(getTokens);

  // 1. Поиск общего СУФФИКСА (справа)
  let suffixTokens: string[] = [];
  let minLen = Math.min(...tokenized.map(t => t.length));
  for (let i = 1; i <= minLen; i++) {
    const last = tokenized[0][tokenized[0].length - i];
    if (tokenized.every(t => t[t.length - i] === last)) {
      suffixTokens.unshift(last);
    } else break;
  }

  if (suffixTokens.length > 0) {
    const suffixStr = suffixTokens.join('');
    const remaining = tokenized.map(t => {
      const rest = t.slice(0, t.length - suffixTokens.length).join('');
      return rest === '' ? 'ε' : rest;
    });
    return simplifyConcat(wrapOr(factorize(remaining)), suffixStr);
  }

  // 2. Поиск общего ПРЕФИКСА (слева)
  let prefixTokens: string[] = [];
  for (let i = 0; i < minLen; i++) {
    const first = tokenized[0][i];
    if (tokenized.every(t => t[i] === first)) {
      prefixTokens.push(first);
    } else break;
  }

  if (prefixTokens.length > 0) {
    const prefixStr = prefixTokens.join('');
    const remaining = tokenized.map(t => {
      const rest = t.slice(prefixTokens.length).join('');
      return rest === '' ? 'ε' : rest;
    });
    return simplifyConcat(prefixStr, wrapOr(factorize(remaining)));
  }

  // Правило Kleene: ε | R+ -> R* ИЛИ ε | RR* -> R*
  if (terms.includes('ε')) {
    const others = terms.filter(t => t !== 'ε');
    if (others.length === 1) {
      let r = others[0];
      if (r.endsWith('+')) return r.slice(0, -1) + '*';

      const tokens = getTokens(r);
      if (tokens.length > 1) {
        const last = tokens[tokens.length - 1];
        const prev = tokens.slice(0, -1).join('');
        if (last.endsWith('*') && (prev === last.slice(0, -1) || wrap(prev) === last.slice(0, -1))) {
          return last;
        }
      }
    }
  }

  return terms.sort().join('|');
}

// --- УПРОЩЕНИЕ CONCAT ---
function simplifyConcat(a: string, b: string): string {
  if (!a || a === 'ε' || a === '') return b;
  if (!b || b === 'ε' || b === '') return a;

  const tA = getTokens(a);
  const tB = getTokens(b);

  // Правило: R R* -> R+
  if (tB.length === 1 && tB[0].endsWith('*')) {
    const base = tB[0].slice(0, -1);
    if (a === base || wrap(a) === base) return wrap(base) + '+';
  }
  // Правило: R* R -> R+
  if (tA.length === 1 && tA[0].endsWith('*')) {
    const base = tA[0].slice(0, -1);
    if (b === base || wrap(b) === base) return wrap(base) + '+';
  }

  // Дополнительно: (a+b)(a+b)* -> (a+b)+
  if (tA.length > 0 && tB.length > 0) {
    const lastA = tA[tA.length - 1];
    const firstB = tB[0];
    if (firstB.endsWith('*') && (lastA === firstB.slice(0, -1) || wrap(lastA) === firstB.slice(0, -1))) {
        const prefix = tA.slice(0, -1).join('');
        const suffix = tB.slice(1).join('');
        return simplifyConcat(simplifyConcat(prefix, wrap(lastA) + '+'), suffix);
    }
  }

  return wrapForConcat(a) + wrapForConcat(b);
}

function simplifyStar(a: string): string {
  if (!a || a === 'ε' || a === '∅') return '';
  const inner = strip(a);
  if (inner.endsWith('*') || inner.endsWith('+')) return inner.slice(0, -1) + '*';
  return wrap(inner) + '*';
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function splitByOr(s: string): string[] {
  const result: string[] = [];
  let balance = 0, current = "";
  for (const c of s) {
    if (c === '(') balance++;
    else if (c === ')') balance--;
    if (c === '|' && balance === 0) {
      result.push(current);
      current = "";
    } else current += c;
  }
  result.push(current);
  return result.filter(x => x !== "");
}

function strip(s: string): string {
  if (s.startsWith('(') && s.endsWith(')')) {
    let balance = 0;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') balance++;
      if (s[i] === ')') balance--;
      if (balance === 0 && i > 0) return s;
    }
    return s.slice(1, -1);
  }
  return s;
}

function wrap(s: string): string {
  if (!s || s === 'ε' || s.length === 1) return s;
  if (s.startsWith('(') && s.endsWith(')') && strip(s) !== s) return s;
  return `(${s})`;
}

function wrapOr(s: string): string {
  if (!s || s === 'ε') return 'ε';
  return s.includes('|') ? `(${s})` : s;
}

function wrapForConcat(s: string): string {
  return s.includes('|') && !s.startsWith('(') ? `(${s})` : s;
}

function cleanRegex(re: string): string {
  let res = re;
  for (let i = 0; i < 5; i++) {
    const old = res;
    res = res.replace(/ε/g, '');
    res = res.replace(/\|+/g, '|').replace(/^\||\|$/g, '');
    res = res.replace(/\(\(([^()]+)\)\)/g, '($1)');
    res = res.replace(/\(([a-zA-Z0-9])\)\*/g, '$1*');
    res = res.replace(/\(([a-zA-Z0-9])\)\+/g, '$1+');
    if (old === res) break;
  }
  return res || 'ε';
}