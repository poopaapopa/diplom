import { Node, Edge } from '@xyflow/react';

export const fsmToRegex = (nodes: Node[], edges: Edge[]): string => {
  const initialState = nodes.find(n => n.data?.isInitial || n.id === '0' || n.id === 'q0');
  const finalNodes = nodes.filter(n => n.data?.isFinal);

  if (!initialState || finalNodes.length === 0) return "";

  let L: Record<string, Record<string, string>> = {};

  const add = (u: string, v: string, exp: string) => {
    if (!exp || exp === '∅') return;
    if (!L[u]) L[u] = {};
    L[u][v] = L[u][v] ? simplifyOr(L[u][v], exp) : exp;
  };

  edges.forEach(edge => {
    add(edge.source, edge.target, (edge.data?.symbol as string) || 'ε');
  });

  const S = 'V_START', E = 'V_END';
  add(S, initialState.id, 'ε');
  finalNodes.forEach(f => add(f.id, E, 'ε'));

  const stateIds = nodes
    .map(n => n.id)
    .filter(id => id !== S && id !== E)
    .sort((a, b) => {
      // Стратегия: удаляем сначала те узлы, у которых меньше всего связей
      const deg = (id: string) => (Object.keys(L[id] || {}).length + Object.keys(L).filter(k => L[k][id]).length);
      return deg(a) - deg(b);
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

        const loop = Rkk ? simplifyStar(Rkk) : "";
        const pathThroughK = simplifyConcat(simplifyConcat(Rik, loop), Rkj);

        L[i][j] = Rij ? simplifyOr(Rij, pathThroughK) : pathThroughK;
      }
    }
    delete L[k];
    Object.values(L).forEach(row => delete row[k]);
  }

  const res = L[S]?.[E] || "";
  return res ? cleanRegex(res) : "Путь не найден";
};

// --- ЛОГИКА УПРОЩЕНИЯ ---

function simplifyOr(a: string, b: string): string {
  if (a === b) return a;
  if (a === 'ε' && b.endsWith('+')) return wrap(b.slice(0, -1)) + '*';
  if (b === 'ε' && a.endsWith('+')) return wrap(a.slice(0, -1)) + '*';

  let terms = Array.from(new Set([...splitByOr(a), ...splitByOr(b)]))
    .filter(t => t !== '∅' && t !== '');

  if (terms.length === 1) return terms[0];
  return factorize(terms);
}

function factorize(terms: string[]): string {
  if (terms.length <= 1) return terms[0] || 'ε';

  // Очистка: если есть и 'a', и 'a*', оставляем 'a*'
  const simpleTerms = terms.filter(t => {
    if (t === 'ε') return true;
    const base = t.replace(/[*+]$/, '');
    return !terms.some(other => other === base + '*' && other !== t);
  });

  const tokenized = simpleTerms.map(getTokens);
  const minLen = Math.min(...tokenized.map(t => t.length));

  // 1. Вынос префикса
  let pLen = 0;
  while (pLen < minLen && tokenized.every(t => t[pLen] === tokenized[0][pLen])) {
    pLen++;
  }
  if (pLen > 0) {
    const pref = tokenized[0].slice(0, pLen).join('');
    const rest = tokenized.map(t => t.slice(pLen).join('') || 'ε');
    return simplifyConcat(pref, wrapOr(factorize(rest)));
  }

  // 2. Вынос суффикса
  let sLen = 0;
  while (sLen < minLen && tokenized.every(t => t[t.length - 1 - sLen] === tokenized[0][tokenized[0].length - 1 - sLen])) {
    sLen++;
  }
  if (sLen > 0) {
    const suff = tokenized[0].slice(tokenized[0].length - sLen).join('');
    const rest = tokenized.map(t => t.slice(0, t.length - sLen).join('') || 'ε');
    return simplifyConcat(wrapOr(factorize(rest)), suff);
  }

  return terms.sort().join('|');
}

function simplifyConcat(a: string, b: string): string {
  if (!a || a === 'ε') return b;
  if (!b || b === 'ε') return a;

  const sA = strip(a);
  const sB = strip(b);

  // a a* -> a+, a* a -> a+
  if (sB.endsWith('*') && sA === strip(sB.slice(0, -1))) return wrap(sA) + '+';
  if (sA.endsWith('*') && sB === strip(sA.slice(0, -1))) return wrap(sB) + '+';

  // (a+b)(a+b)* -> (a+b)+
  if (sB.endsWith('*') && sA === sB.slice(0, -1)) return sA + '+';

  return wrapForConcat(a) + wrapForConcat(b);
}

function simplifyStar(a: string): string {
  if (!a || a === 'ε') return '';
  const inner = strip(a);
  if (inner.endsWith('*') || inner.endsWith('+')) return inner.slice(0, -1) + '*';
  return wrap(inner) + '*';
}

// --- УТИЛИТЫ СТРОК ---

function getTokens(s: string): string[] {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    let t = "";
    if (s[i] === '(') {
      let b = 1, start = i++;
      while (i < s.length && b > 0) {
        if (s[i] === '(') b++; else if (s[i] === ')') b--;
        i++;
      }
      t = s.slice(start, i);
    } else t = s[i++];
    while (i < s.length && (s[i] === '*' || s[i] === '+')) t += s[i++];
    tokens.push(t);
  }
  return tokens;
}

function splitByOr(s: string): string[] {
  const res = [];
  let b = 0, curr = "";
  for (const c of s) {
    if (c === '(') b++; else if (c === ')') b--;
    if (c === '|' && b === 0) { res.push(curr); curr = ""; } else curr += c;
  }
  res.push(curr);
  return res.filter(x => x !== "");
}

function isBalanced(s: string): boolean {
  if (!s.startsWith('(') || !s.endsWith(')')) return false;
  let b = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') b++; else if (s[i] === ')') b--;
    if (b === 0 && i < s.length - 1) return false;
  }
  return b === 0;
}

function strip(s: string): string {
  let res = s;
  while (isBalanced(res)) res = res.slice(1, -1);
  return res;
}

function wrap(s: string): string {
  if (!s || s === 'ε' || s.length === 1) return s;
  if (s.length === 2 && (s.endsWith('*') || s.endsWith('+'))) return s;
  if (isBalanced(s)) return s;
  return `(${s})`;
}

function wrapOr(s: string): string {
  if (s === 'ε') return 'ε';
  return (s.includes('|') && !isBalanced(s)) ? `(${s})` : s;
}

function wrapForConcat(s: string): string {
  if (s.includes('|') && !isBalanced(s)) return `(${s})`;
  return s;
}

function cleanRegex(re: string): string {
  let res = re.replace(/ε/g, '');

  // 1. Убираем пустые альтернативы типа (a|) -> a? или (a+|) -> a*
  res = res.replace(/\(([^|()]+)\+\|\)/g, '$1*');
  res = res.replace(/\(\|\(([^|()]+)\)\+\)/g, '($1)*');
  res = res.replace(/\(([^|()]+)\|\)/g, '($1)?');

  // 2. Схлопываем итерации
  res = res.replace(/(.)\1\+/g, '$1+');

  // 3. Убираем лишние двойные скобки
  for(let i=0; i<3; i++) res = res.replace(/\(\(([^()]+)\)\)/g, '($1)');

  return res || 'ε';
}