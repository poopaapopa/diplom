import { Node, Edge } from '@xyflow/react';

type SyntaxNode = {
  type: 'char' | 'or' | 'concat' | 'star';
  value?: string;
  position?: number;
  nullable: boolean;
  firstpos: Set<number>;
  lastpos: Set<number>;
};

let posCounter = 1;
let endPosId = -1;
const followpos: Map<number, Set<number>> = new Map();
const posToChar: Map<number, string> = new Map();

export const regexToFSM = (regex: string, currentNodes: Node[]): { nodes: Node[]; edges: Edge[] } | null => {
  if (!regex.trim()) return null;

  try {
    // 1. Сброс глобальных данных
    posCounter = 1;
    endPosId = -1;
    followpos.clear();
    posToChar.clear();

    // 2. Превращаем регулярку в дерево
    const prepared = transformRegex(regex);
    const postfix = toPostfix(prepared);
    const root = buildTree(postfix);

    if (!root) return null;

    // 3. Алфавит (все символы кроме спецсимволов)
    const alphabet = Array.from(new Set(posToChar.values())).filter(c => c !== '#');

    // 4. Построение ДКА
    const startSet = Array.from(root.firstpos).sort((a, b) => a - b);
    const startKey = startSet.join(',');

    const dstates: string[] = [startKey];
    const statesMap = new Map<string, string>();
    statesMap.set(startKey, '0'); // Всегда начинаем с твоего узла '0'

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Сохраняем якорь
    const startAnchor = currentNodes.find(n => n.id === 'start-anchor');
    if (startAnchor) nodes.push(startAnchor);

    edges.push({
      id: 'start-edge',
      source: 'start-anchor',
      target: '0',
      targetHandle: 'main-target',
      type: 'straight',
      selectable: false,
      deletable: false
    });

    let i = 0;
    while (i < dstates.length) {
      const currentKey = dstates[i];
      const currentPosSet = new Set(currentKey.split(',').map(Number));
      const uId = statesMap.get(currentKey)!;

      // КРИТИЧЕСКОЕ: Проверка на конечность (содержит ли набор позицию #)
      const isFinal = currentPosSet.has(endPosId);

      const existing = currentNodes.find(n => n.id === uId);
      nodes.push({
        id: uId,
        type: 'fsmNode',
        position: existing?.position || { x: i * 220 + 150, y: 150 },
        data: {
          label: uId === '0' ? 'q0' : uId,
          isInitial: uId === '0',
          isFinal: isFinal
        }
      });

      for (const symbol of alphabet) {
        const nextPosSet = new Set<number>();
        for (const pos of currentPosSet) {
          if (posToChar.get(pos) === symbol) {
            followpos.get(pos)?.forEach(p => nextPosSet.add(p));
          }
        }

        if (nextPosSet.size > 0) {
          const nextKey = Array.from(nextPosSet).sort((a, b) => a - b).join(',');
          if (!statesMap.has(nextKey)) {
            const newId = `q${statesMap.size}`;
            statesMap.set(nextKey, newId);
            dstates.push(nextKey);
          }

          const vId = statesMap.get(nextKey)!;
          const isLoop = uId === vId;
          edges.push({
            id: `edge-${uId}-${vId}-${symbol}-${i}`,
            source: uId,
            target: vId,
            sourceHandle: isLoop ? 'loop-source' : 'main-source',
            targetHandle: isLoop ? 'loop-target' : 'main-target',
            type: isLoop ? 'selfloop' : 'transition',
            data: { symbol }
          });
        }
      }
      i++;
    }

    return { nodes, edges };
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Вставляет точки конкатенации и добавляет маркер конца #
 */
function transformRegex(re: string): string {
  // b+ -> (bb*)
  let processed = re.replace(/([a-zA-Z0-9)])\+/g, '($1$1*)');

  let res = "";
  for (let i = 0; i < processed.length; i++) {
    let c1 = processed[i];
    res += c1;
    if (i + 1 < processed.length) {
      let c2 = processed[i + 1];
      if (
        (/[a-zA-Z0-9*)]/.test(c1) && /[a-zA-Z0-9(]/.test(c2))
      ) {
        res += ".";
      }
    }
  }
  return `(${res}).#`; // Оборачиваем всё и добавляем конец
}

function toPostfix(re: string): string {
  const prec: any = { '*': 3, '.': 2, '|': 1 };
  let out = "", stack: string[] = [];
  for (const c of re) {
    if (/[a-zA-Z0-9#]/.test(c)) out += c;
    else if (c === '(') stack.push(c);
    else if (c === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') out += stack.pop();
      stack.pop();
    } else {
      while (stack.length && prec[stack[stack.length - 1]] >= prec[c]) out += stack.pop();
      stack.push(c);
    }
  }
  return out + stack.reverse().join('');
}

function buildTree(postfix: string): SyntaxNode | null {
  const stack: SyntaxNode[] = [];
  for (const c of postfix) {
    if (/[a-zA-Z0-9#]/.test(c)) {
      const p = posCounter++;
      posToChar.set(p, c);
      followpos.set(p, new Set());
      if (c === '#') endPosId = p;

      stack.push({
        type: 'char', value: c, position: p, nullable: false,
        firstpos: new Set([p]), lastpos: new Set([p])
      });
    } else if (c === '*') {
      const n = stack.pop()!;
      n.lastpos.forEach(p => n.firstpos.forEach(f => followpos.get(p)?.add(f)));
      stack.push({
        type: 'star', nullable: true,
        firstpos: new Set(n.firstpos), lastpos: new Set(n.lastpos)
      });
    } else if (c === '|') {
      const r = stack.pop()!, l = stack.pop()!;
      stack.push({
        type: 'or', nullable: l.nullable || r.nullable,
        firstpos: new Set([...l.firstpos, ...r.firstpos]),
        lastpos: new Set([...l.lastpos, ...r.lastpos])
      });
    } else if (c === '.') {
      const r = stack.pop()!, l = stack.pop()!;
      l.lastpos.forEach(lp => r.firstpos.forEach(rf => followpos.get(lp)?.add(rf)));
      stack.push({
        type: 'concat',
        nullable: l.nullable && r.nullable,
        firstpos: l.nullable ? new Set([...l.firstpos, ...r.firstpos]) : new Set(l.firstpos),
        lastpos: r.nullable ? new Set([...l.lastpos, ...r.lastpos]) : new Set(r.lastpos)
      });
    }
  }
  return stack[0];
}