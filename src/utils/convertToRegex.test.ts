/**
 * Тесты round-trip конверсии: regex -> FSM -> regex.
 *
 * Сравнивать получившиеся регулярки текстуально нельзя — упрощалка может
 * привести выражение к синтаксически другой, но эквивалентной форме (например,
 * `a(bc*b)*` и `a((bb|c)*b|a)` описывают один язык).  Поэтому равенство
 * проверяем по языку: компилируем обе регулярки в JS-RegExp и прогоняем через
 * них набор строк длиной до некоторой границы; если множества принимаемых
 * строк совпадают — регулярки эквивалентны на этой границе.
 *
 * Для маленьких алфавитов и небольших выражений граница длины 6–8 ловит
 * подавляющее большинство ошибок.
 */

import { fsmToRegex } from './convertToRegex';
import { regexToFSM } from './convertToFSM';
import { Node } from '@xyflow/react';

/** Перевод нашей внутренней регулярки в JS-RegExp.  В нашей нотации:
 *  - `|` уже совпадает с RegExp,
 *  - `*`, `+`, `?` уже совпадают,
 *  - буквы/цифры/`(`/`)` совпадают.
 *  То есть достаточно обернуть в ^...$ и использовать как есть. */
function compile(re: string): RegExp {
  if (!re || re === 'ε') return /^$/;
  return new RegExp(`^(?:${re})$`);
}

/** Генерация всех слов в алфавите длины <= maxLen. */
function generateWords(alphabet: string[], maxLen: number): string[] {
  const out: string[] = [''];
  let frontier = [''];
  for (let len = 1; len <= maxLen; len++) {
    const next: string[] = [];
    for (const w of frontier) {
      for (const c of alphabet) next.push(w + c);
    }
    out.push(...next);
    frontier = next;
  }
  return out;
}

function extractAlphabet(re: string): string[] {
  return Array.from(new Set(re.match(/[a-zA-Z0-9]/g) || [])).sort();
}

/** Проверяет, что два регэкспа задают один и тот же язык
 *  на всех словах длины <= maxLen в алфавите re1 ∪ re2. */
function languagesEqual(re1: string, re2: string, maxLen = 6): { ok: true } | { ok: false; word: string; r1: boolean; r2: boolean } {
  const alphabet = Array.from(new Set([...extractAlphabet(re1), ...extractAlphabet(re2)])).sort();
  const r1 = compile(re1);
  const r2 = compile(re2);
  for (const w of generateWords(alphabet, maxLen)) {
    const m1 = r1.test(w), m2 = r2.test(w);
    if (m1 !== m2) return { ok: false, word: w || 'ε', r1: m1, r2: m2 };
  }
  return { ok: true };
}

/** Прогоняет regex -> FSM -> regex и возвращает результат. */
function roundTrip(regex: string): string {
  // regexToFSM ожидает «текущее состояние» nodes/edges; передаём пустые списки
  // и фиктивный start-anchor.
  const startAnchor: Node = {
    id: 'start-anchor',
    type: 'startAnchor',
    position: { x: 0, y: 0 },
    data: {},
  };
  const built = regexToFSM(regex, [startAnchor]);
  if (!built) throw new Error(`regexToFSM returned null for "${regex}"`);
  return fsmToRegex(built.nodes, built.edges);
}

describe('regex -> FSM -> regex round-trip', () => {
  // Простейшие случаи
  test.each([
    ['a',         'a'],
    ['a*',        'a*'],
    ['ab',        'ab'],
    ['a*b',       'a*b'],
    ['(a+b)*',    '(a+b)*'],
    ['ab+c',    'ab+c'],
  ])('%s -> %s (язык совпадает)', (input) => {
    const out = roundTrip(input);
    const eq = languagesEqual(input, out, 6);
    if (!eq.ok) {
      throw new Error(
        `Языки разные.\n  Исходная regex: ${input}\n  Полученная regex: ${out}\n` +
        `  Слово "${eq.word}" принимается ${eq.r1 ? 'исходной' : 'полученной'}, ` +
        `но НЕ ${eq.r1 ? 'полученной' : 'исходной'}.`
      );
    }
  });

  // Сложные случаи — заявленные пользователем
  function check(input: string, maxLen = 6) {
    const out = roundTrip(input);
    const eq = languagesEqual(input, out, maxLen);
    if (!eq.ok) {
      throw new Error(
        `Языки разные.\n  Исходная regex: ${input}\n  Полученная regex: ${out}\n` +
        `  Слово "${eq.word}" принимается ${eq.r1 ? 'исходной' : 'полученной'}, ` +
        `но НЕ ${eq.r1 ? 'полученной' : 'исходной'}.`
      );
    }
  }

  test('a(bc*b)*', () => check('a(bc*b)*', 7));
  test('(a+b)*aa', () => check('(a+b)*aa'));
  test('a*b*c*', () => check('a*b*c*'));
  test('b(a+b)*', () => check('b(a+b)*'));
  test('(a+b)*aa(a+b)*', () => check('(a+b)*aa(a+b)*'));
  test('1+(a+b)*bb(a+b)*', () => check('1+(a+b)*bb(a+b)*'));
  test('(0*1*)*000', () => check('(0*1*)*000'));
});

describe('regex -> FSM -> regex: ожидаемая «красивая» форма', () => {
  // Эти проверки — не на эквивалентность, а на то, что упрощалка приводит
  // к ожидаемому компактному виду.  Если они когда-нибудь сломаются, но
  // round-trip-тесты выше пройдут, значит, ответ просто стал другим
  // (но всё ещё корректным) — можно обновить ожидание.

  test('a(bc*b)*  -> a(bc*b)*', () => {
    expect(roundTrip('a(bc*b)*')).toBe('a(bc*b)*');
  });

  test('(a+b)*aa(a+b)*bb  -> (a+b)*aa(a+b)*bb', () => {
    expect(roundTrip('(a+b)*aa(a+b)*bb')).toBe('(a+b)*aa(a+b)*bb');
  });
});
