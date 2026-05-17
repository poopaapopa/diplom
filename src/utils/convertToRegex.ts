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

  // Стратегия исключения состояний (порядок имеет значение!):
  //  1. Сначала исключаем «внутренние» состояния (не начальное и не конечные).
  //  2. Затем — конечные состояния.
  //  3. Начальное состояние исключаем ПОСЛЕДНИМ. Так результат естественно
  //     принимает форму  (петли_на_q0)* · (путь_от_q0_к_финалу),
  //     что соответствует нормальной форме Ардена и даёт самые компактные
  //     выражения вида (a+b)*aa вместо (ab)*aa(a*b(ab)*aa)*.
  //  4. Внутри одной группы — узлы с меньшим числом связей идут первыми.
  //  5. При прочих равных предпочитаем узел с self-loop (исключается «чисто» в R*).
  const initialId = initialState.id;
  const finalIds = new Set(finalNodes.map(n => n.id));
  // 0 — внутренние, 1 — финальные, 2 — начальное
  const tier = (id: string) => (id === initialId ? 2 : finalIds.has(id) ? 1 : 0);

  const stateIds = nodes
    .map(n => n.id)
    .filter(id => id !== S && id !== E)
    .sort((a, b) => {
      const tA = tier(a), tB = tier(b);
      if (tA !== tB) return tA - tB;

      const deg = (id: string) => {
        const row = L[id] || {};
        // self-loop не считаем дважды (он вклад как in, так и out)
        const out = Object.keys(row).filter(k => k !== id).length;
        const inc = Object.keys(L).filter(k => k !== id && L[k]?.[id]).length;
        return out + inc;
      };
      const dA = deg(a), dB = deg(b);
      if (dA !== dB) return dA - dB;

      // Лёгкое предпочтение узлам с self-loop — они исключаются «чисто» в R*
      const selfA = L[a]?.[a] ? 1 : 0;
      const selfB = L[b]?.[b] ? 1 : 0;
      return selfB - selfA;
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
  let simpleTerms = terms.filter(t => {
    if (t === 'ε') return true;
    const base = t.replace(/[*+]$/, '');
    return !terms.some(other => other === base + '*' && other !== t);
  });

  // Алгебраические тождества с ε, безопасные на этом уровне:
  //   ε | X+   ->  X*
  //   ε | X*   ->  X*
  // ε | X -> X? мы здесь НЕ применяем, чтобы не вводить токен '?',
  // который ломает getTokens / wrap (они знают только * и +).
  // «?» вставит cleanRegex на финальной стадии через collapseEmptyAlt.
  if (simpleTerms.includes('ε') && simpleTerms.length === 2) {
    const x = simpleTerms.find(t => t !== 'ε')!;
    // Тождества ε|X+ -> X*  и  ε|X* -> X*  верны только когда оператор
    // + или * применяется ко ВСЕМУ выражению X, а не к его последнему
    // токену.  Например, ε|cc*  ≠  cc*  (последний не принимает ε), и
    // ε|ab+  ≠  (ab)*.  Поэтому сначала убеждаемся, что x — один токен
    // (атом или полностью заскобленная группа) с постфиксом */+.
    const xTokens = getTokens(x);
    const isSingleAtom = xTokens.length === 1;
    if (isSingleAtom && x.endsWith('+')) {
      const base = x.slice(0, -1);
      return wrap(strip(base)) + '*';
    }
    if (isSingleAtom && x.endsWith('*')) {
      return x;
    }
    // Тождества ε | XX* = X*  и  ε | X*X = X*.
    // Здесь X — ровно один токен, и применение * охватывает обе позиции
    // (поэтому ε действительно поглощается в X*). Эти случаи безопасны
    // и возникают на практике после исключения состояний (например,
    // ε | aa* при сворачивании self-loop).
    if (xTokens.length === 2) {
      const [t0, t1] = xTokens;
      if (t1 === t0 + '*') return wrap(strip(t0)) + '*';
      if (t0 === t1 + '*') return wrap(strip(t1)) + '*';
    }
  }

  // Перед тем как искать общий префикс/суффикс, снимем «лишние» скобки
  // конкатенации вида (X) (где X не имеет верхнеуровневого | и за ) не
  // следует *, +, ?). Без этого структура терма может быть скрыта парами
  // скобок и общий префикс не находится.
  const tokenized = simpleTerms
    .map(t => stripRedundantConcatParens(t))
    .map(getTokens);
  const minLen = Math.min(...tokenized.map(t => t.length));

  // 1. Вынос префикса
  let pLen = 0;
  while (pLen < minLen) {
    const currentPLen = pLen;
    if (!tokenized.every(t => t[currentPLen] === tokenized[0][currentPLen])) {
      break;
    }
    pLen++;
  }
  if (pLen > 0) {
    const pref = tokenized[0].slice(0, pLen).join('');
    const rest = tokenized.map(t => t.slice(pLen).join('') || 'ε');
    return simplifyConcat(pref, wrapOr(factorize(rest)));
  }

  // 2. Вынос суффикса
  let sLen = 0;
  while (sLen < minLen) {
    const currentSLen = sLen;
    if (!tokenized.every(t => t[t.length - 1 - currentSLen] === tokenized[0][tokenized[0].length - 1 - currentSLen])) {
      break;
    }
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

  // 1. Убираем пустые альтернативы вида (X|) -> X? и (X+|) -> X*.
  //    Делаем это вручную с учётом балансировки скобок, чтобы X мог
  //    содержать вложенные группы, например (a(b|c)*|) -> (a(b|c)*)?.
  res = collapseEmptyAlt(res);
  res = stripRedundantConcatParens(res);

  // 2. Схлопываем итерации и постфиксные операторы.
  let prev = "";
  while (prev !== res) {
    prev = res;

    // 2a. Свёртки X·X* -> X+, X*·X -> X+, и аналоги для одиночных атомов /
    //     не вложенных групп. Их и было раньше.
    res = res.replace(/([a-zA-Zε0-9])\*\1/g, '$1+');
    res = res.replace(/([a-zA-Zε0-9])\1\*/g, '$1+');
    res = res.replace(/(\([^()]+\))\*\1/g, '$1+');
    res = res.replace(/(\([^()]+\))\1\*/g, '$1+');
    res = res.replace(/(.)\1\+/g, '$1+');

    // 2b. То же самое, но с произвольно вложенным X через балансировку:
    //     X(X)* -> (X)+, (X)(X)* -> (X)+ при многотокенных X.
    res = collapseRepeatedConcat(res);

    // 2c. Свёртки соседних постфиксных операторов:
    //     (X+)? -> X*, (X*)? -> X*, (X?)+ -> X*, и т.п.
    //     Так как +/*/? — постфиксные и применяются к одному и тому же
    //     операнду, их «комбинация» эквивалентна одному из {*, +, ?}.
    res = res.replace(/\+\?/g, '*');
    res = res.replace(/\*\?/g, '*');
    res = res.replace(/\?\*/g, '*');
    res = res.replace(/\?\+/g, '*');
    res = res.replace(/\+\*/g, '*');
    res = res.replace(/\*\+/g, '*');
    res = res.replace(/\*\*/g, '*');
    res = res.replace(/\+\+/g, '+');

    // 2d. (a)+ -> a+, (a)* -> a*, (a)? -> a?  для атомарного X.
    res = res.replace(/\(([a-zA-Zε0-9])\)([*+?])/g, '$1$2');

    // 2e. Снимаем «лишние» скобки вокруг одного токена с любым числом
    //     уровней вложенности: ((a+b)+) -> (a+b)+, ((a+b)+)? -> (a+b)+?
    //     (затем 2c сольёт +? -> *).  Корректно учитываем баланс скобок.
    res = stripRedundantSingleTokenParens(res);
  }

  // 3. Убираем лишние двойные скобки
  for(let i=0; i<3; i++) res = res.replace(/\(\(([^()]+)\)\)/g, '($1)');

  return res || 'ε';
}

/**
 * Свёртка X·(X)* -> (X)+ и (X)·(X)* -> (X)+, где X — произвольное
 * выражение в скобках (возможно с вложениями).
 */
function collapseRepeatedConcat(s: string): string {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '(') continue;
      // Находим парную закрывающую скобку
      let b = 1, j = i + 1;
      while (j < s.length && b > 0) {
        if (s[j] === '(') b++;
        else if (s[j] === ')') b--;
        if (b === 0) break;
        j++;
      }
      if (b !== 0) continue;

      const op = s[j + 1];
      if (op !== '*') continue; // только X·X* -> X+ безопасно (X·X+ ≠ X+)

      const inner = s.slice(i + 1, j); // содержимое (..)
      const paren = '(' + inner + ')';

      // Вариант A: непосредственно перед "(" идёт ровно X (без скобок)
      if (i >= inner.length && s.slice(i - inner.length, i) === inner) {
        const before = s.slice(0, i - inner.length);
        const after = s.slice(j + 2);
        s = before + paren + '+' + after;
        changed = true;
        break;
      }
      // Вариант B: непосредственно перед "(" идёт (X)
      if (i >= paren.length && s.slice(i - paren.length, i) === paren) {
        const before = s.slice(0, i - paren.length);
        const after = s.slice(j + 2);
        s = before + paren + '+' + after;
        changed = true;
        break;
      }
    }
  }
  return s;
}

/**
 * Снимаем «лишние» скобки конкатенации вида (X), за которыми НЕ следует
 * постфиксный оператор (*, +, ?), и где X не содержит верхнеуровневой
 * альтернативы (|). Такие скобки не несут смысла и только мешают
 * фактору находить общий префикс/суффикс.
 *
 * Примеры:
 *   ((1+ab)c+d)(c+d)*  ->  (1+ab)c+d(c+d)*
 *   (a)b               ->  ab
 *   (a|b)c             ->  (a|b)c   (без изменений: внутри есть |)
 *   (ab)*              ->  (ab)*    (без изменений: после ) идёт *)
 */
function stripRedundantConcatParens(s: string): string {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '(') continue;
      let b = 1, j = i + 1;
      while (j < s.length && b > 0) {
        if (s[j] === '(') b++;
        else if (s[j] === ')') b--;
        if (b === 0) break;
        j++;
      }
      if (b !== 0) continue;
      const next = s[j + 1];
      if (next === '*' || next === '+' || next === '?') continue;
      const inner = s.slice(i + 1, j);
      if (!inner) continue;
      if (splitByOr(inner).length > 1) continue;
      // Скобки безопасны к удалению.
      s = s.slice(0, i) + inner + s.slice(j + 1);
      changed = true;
      break;
    }
  }
  return s;
}

/**
 * Снимаем избыточные скобки вокруг одного токена: если содержимое
 * (...) при разборе через getTokens даёт ровно один токен, скобки можно
 * убрать без потери смысла. Например:
 *   ((a+b)+)     -> (a+b)+
 *   ((a+b)+)?    -> (a+b)+?  (далее правило 2c свернёт +? в *)
 */
function stripRedundantSingleTokenParens(s: string): string {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '(') continue;
      let b = 1, j = i + 1;
      while (j < s.length && b > 0) {
        if (s[j] === '(') b++;
        else if (s[j] === ')') b--;
        if (b === 0) break;
        j++;
      }
      if (b !== 0) continue;
      const inner = s.slice(i + 1, j);
      if (!inner) continue;
      // Не трогаем альтернативы — там скобки нужны.
      if (splitByOr(inner).length > 1) continue;
      // Если внутреннее содержимое — ровно один токен, скобки лишние.
      const tokens = getTokens(inner);
      if (tokens.length !== 1) continue;
      s = s.slice(0, i) + inner + s.slice(j + 1);
      changed = true;
      break;
    }
  }
  return s;
}

/**
 * Сворачиваем вхождения вида (X|) и (|X) в X? (или X* / X+, если X
 * заканчивается на + / *), корректно учитывая вложенные скобки.
 */
function collapseEmptyAlt(s: string): string {
  // Ищем позиции верхнеуровневых групп ( ... ) и пробуем свернуть.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '(') continue;
      // Найти соответствующую закрывающую скобку
      let b = 1, j = i + 1;
      while (j < s.length && b > 0) {
        if (s[j] === '(') b++;
        else if (s[j] === ')') b--;
        if (b === 0) break;
        j++;
      }
      if (b !== 0) continue;
      const inner = s.slice(i + 1, j);
      // Разбиваем по | верхнего уровня
      const parts = splitByOr(inner);
      const hasEmpty = inner.endsWith('|') || inner.startsWith('|') || parts.length !== splitByOrKeepEmpty(inner).length;
      if (!hasEmpty || parts.length === 0) continue;

      // Берём первую непустую альтернативу как X (если их несколько — оставляем как есть)
      if (parts.length !== 1) continue;
      const x = parts[0];
      let replacement: string;
      // Сворачиваем альтернативу с ε только если она безопасна.
      // (X+|) -> X*  всегда корректно (X+ | ε = X*).
      // (X*|) -> X*  корректно лишь когда X* — это всё выражение целиком,
      //              а не, например, "ab*", где * относится только к b.
      // В остальных случаях выдаём (X)?.
      const tokens = getTokens(x);
      const isSingleAtom = tokens.length === 1;
      if (x.endsWith('+') && isSingleAtom) {
        replacement = x.slice(0, -1) + '*';
      } else if (x.endsWith('*') && isSingleAtom) {
        replacement = x; // X* | ε = X*
      } else {
        replacement = wrap(x) + '?';
      }
      s = s.slice(0, i) + replacement + s.slice(j + 1);
      changed = true;
      break;
    }
  }
  return s;
}

function splitByOrKeepEmpty(s: string): string[] {
  const res: string[] = [];
  let b = 0, curr = "";
  for (const c of s) {
    if (c === '(') b++; else if (c === ')') b--;
    if (c === '|' && b === 0) { res.push(curr); curr = ""; } else curr += c;
  }
  res.push(curr);
  return res;
}

