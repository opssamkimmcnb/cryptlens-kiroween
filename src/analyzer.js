/**
 * CryptLens Static Code Analyzer
 * Pure ES module compatible with both Browser and Node.js (`node --test`).
 */

export const HAUNT_TIERS = [
  { min: 75, id: 'eldritch', label: 'Eldritch Horror', color: '#ff3864' },
  { min: 45, id: 'poltergeist', label: 'Poltergeist', color: '#ff8c42' },
  { min: 18, id: 'mild', label: 'Mild Haunt', color: '#c77dff' },
  { min: 0, id: 'sanctified', label: 'Sanctified', color: '#4ef2b8' }
];

const JS_CONTROL_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'else', 'try', 'finally', 'do', 'return', 'throw', 'new', 'await'
]);

/**
 * Detect language from filename extension or code heuristics.
 * @param {string} code
 * @param {string} [filename]
 * @returns {'python'|'javascript'}
 */
export function detectLanguage(code, filename = '') {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(lower)) return 'javascript';

  const pyHints = (code.match(/^\s*(def|async\s+def|import\s+\w+|from\s+\w+\s+import|elif\b|except\b)/gm) || []).length;
  const jsHints = (code.match(/\b(function|const|let|var|=>|console\.log|export|import\s+.*\s+from)\b/g) || []).length;
  return pyHints > jsHints ? 'python' : 'javascript';
}

/**
 * Strip comments and string literal contents while preserving line breaks and positions.
 * @param {string} code
 * @param {'python'|'javascript'} lang
 * @returns {{ sanitized: string, commentLines: number, codeLines: number, totalLines: number }}
 */
export function sanitizeCode(code, lang) {
  if (!code) {
    return { sanitized: '', commentLines: 0, codeLines: 0, totalLines: 0 };
  }

  const out = [];
  const commentLineSet = new Set();
  const codeLineSet = new Set();
  let line = 1;
  let i = 0;
  const n = code.length;

  const pushChar = (ch, isCode = false) => {
    if (ch === '\n') {
      out.push('\n');
      line++;
    } else {
      out.push(isCode ? ch : ' ');
      if (isCode && ch !== ' ' && ch !== '\t' && ch !== '\r') {
        codeLineSet.add(line);
      }
    }
  };

  while (i < n) {
    const ch = code[i];
    const next = code[i + 1] || '';

    if (lang === 'python') {
      // Triple-quoted strings
      if ((code.slice(i, i + 3) === '"""') || (code.slice(i, i + 3) === "'''")) {
        const quote = code.slice(i, i + 3);
        codeLineSet.add(line);
        out.push('"', ' ', ' ');
        i += 3;
        while (i < n && code.slice(i, i + 3) !== quote) {
          pushChar(code[i], false);
          i++;
        }
        if (i < n) {
          out.push('"', ' ', ' ');
          i += 3;
        }
        continue;
      }
      // Single-line # comment
      if (ch === '#') {
        commentLineSet.add(line);
        while (i < n && code[i] !== '\n') {
          out.push(' ');
          i++;
        }
        continue;
      }
      // Single or double quoted string
      if (ch === '"' || ch === "'") {
        const q = ch;
        codeLineSet.add(line);
        out.push(q);
        i++;
        while (i < n && code[i] !== q && code[i] !== '\n') {
          if (code[i] === '\\' && i + 1 < n) {
            out.push(' ', ' ');
            i += 2;
          } else {
            out.push(' ');
            i++;
          }
        }
        if (i < n && code[i] === q) {
          out.push(q);
          i++;
        }
        continue;
      }
    } else {
      // JS/TS single-line comment
      if (ch === '/' && next === '/') {
        commentLineSet.add(line);
        while (i < n && code[i] !== '\n') {
          out.push(' ');
          i++;
        }
        continue;
      }
      // JS/TS block comment
      if (ch === '/' && next === '*') {
        commentLineSet.add(line);
        out.push(' ', ' ');
        i += 2;
        while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
          commentLineSet.add(line);
          pushChar(code[i], false);
          i++;
        }
        if (i < n) {
          out.push(' ', ' ');
          i += 2;
        }
        continue;
      }
      // Strings & template literals
      if (ch === '"' || ch === "'" || ch === '`') {
        const q = ch;
        codeLineSet.add(line);
        out.push(q);
        i++;
        while (i < n && code[i] !== q) {
          if (code[i] === '\n' && q !== '`') break;
          if (code[i] === '\\' && i + 1 < n) {
            if (code[i + 1] === '\n') {
              out.push(' ');
              pushChar('\n', false);
            } else {
              out.push(' ', ' ');
            }
            i += 2;
          } else {
            pushChar(code[i], false);
            i++;
          }
        }
        if (i < n && code[i] === q) {
          out.push(q);
          i++;
        }
        continue;
      }
    }

    pushChar(ch, true);
    i++;
  }

  return {
    sanitized: out.join(''),
    commentLines: commentLineSet.size,
    codeLines: codeLineSet.size,
    totalLines: code.split('\n').length
  };
}

/**
 * Compute cyclomatic complexity on sanitized code segment.
 * @param {string} sanitizedSegment
 * @param {'python'|'javascript'} lang
 * @returns {number}
 */
export function computeCyclomaticComplexity(sanitizedSegment, lang) {
  if (!sanitizedSegment || !sanitizedSegment.trim()) return 1;
  let branches = 0;

  if (lang === 'python') {
    const kwMatches = sanitizedSegment.match(/\b(if|elif|for|while|except|and|or)\b/g);
    branches += kwMatches ? kwMatches.length : 0;
  } else {
    const kwMatches = sanitizedSegment.match(/\b(if|for|while|case|catch)\b/g);
    branches += kwMatches ? kwMatches.length : 0;
    const opMatches = sanitizedSegment.match(/&&|\|\||\?\?/g);
    branches += opMatches ? opMatches.length : 0;
    // Ternary ? not preceded/followed by ? or .
    const ternaryMatches = sanitizedSegment.match(/(?<![?.])\?(?![?.:])/g);
    branches += ternaryMatches ? ternaryMatches.length : 0;
  }

  return 1 + branches;
}

/**
 * Compute maximum control-flow nesting depth on sanitized segment.
 * @param {string} sanitizedSegment
 * @param {'python'|'javascript'} lang
 * @returns {number}
 */
export function computeMaxNesting(sanitizedSegment, lang) {
  if (!sanitizedSegment || !sanitizedSegment.trim()) return 0;

  if (lang === 'python') {
    const lines = sanitizedSegment.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return 0;
    const baseIndent = Math.min(...lines.map((l) => l.match(/^\s*/)[0].length));
    let maxLevels = 0;
    for (const l of lines) {
      const indent = Math.max(0, l.match(/^\s*/)[0].length - baseIndent);
      const level = Math.floor(indent / 4);
      if (level > maxLevels) maxLevels = level;
    }
    return Math.max(0, maxLevels - 1);
  }

  let depth = 0;
  let maxDepth = 0;
  for (let i = 0; i < sanitizedSegment.length; i++) {
    const ch = sanitizedSegment[i];
    if (ch === '{') {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
    } else if (ch === '}') {
      depth = Math.max(0, depth - 1);
    }
  }
  // Subtract 1 for the function body's outer braces
  return Math.max(0, maxDepth - 1);
}

/**
 * Extract top-level and nested functions with line ranges and metrics.
 * @param {string} rawCode
 * @param {string} sanitizedCode
 * @param {'python'|'javascript'} lang
 */
export function extractFunctions(rawCode, sanitizedCode, lang) {
  const rawLines = rawCode.split('\n');
  const sanLines = sanitizedCode.split('\n');
  const functions = [];

  if (lang === 'python') {
    for (let idx = 0; idx < sanLines.length; idx++) {
      const m = sanLines[idx].match(/^(\s*)(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      if (!m) continue;
      const baseIndent = m[1].length;
      const name = m[2];
      let endIdx = idx;
      for (let j = idx + 1; j < sanLines.length; j++) {
        const line = sanLines[j];
        if (line.trim() === '') continue;
        const indent = line.match(/^\s*/)[0].length;
        if (indent <= baseIndent) break;
        endIdx = j;
      }
      const sanSlice = sanLines.slice(idx, endIdx + 1).join('\n');
      const rawSlice = rawLines.slice(idx, endIdx + 1).join('\n');
      functions.push({
        name,
        startLine: idx + 1,
        endLine: endIdx + 1,
        loc: endIdx - idx + 1,
        complexity: computeCyclomaticComplexity(sanSlice, lang),
        maxNesting: computeMaxNesting(sanSlice, lang),
        sanitizedBody: sanSlice,
        preview: rawSlice
      });
    }
    return functions;
  }

  // JavaScript / TypeScript: locate function headers and match braces
  const headerPatterns = [
    /(?:^|[;\s])(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*(?::\s*[^\{=]+)?\{/g,
    /(?:^|[;\s])(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*(?::\s*[^=]+)?=>\s*\{/g,
    /(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*\{/g
  ];

  const seenStarts = new Set();
  const lineOffsets = [0];
  for (let i = 0; i < sanitizedCode.length; i++) {
    if (sanitizedCode[i] === '\n') lineOffsets.push(i + 1);
  }
  const offsetToLine = (offset) => {
    let lo = 0;
    let hi = lineOffsets.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lineOffsets[mid] <= offset) lo = mid + 1;
      else hi = mid - 1;
    }
    return Math.max(1, lo);
  };

  for (const regex of headerPatterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(sanitizedCode)) !== null) {
      const name = match[1];
      if (!name || JS_CONTROL_KEYWORDS.has(name)) continue;
      const braceOpenIdx = match.index + match[0].lastIndexOf('{');
      if (seenStarts.has(braceOpenIdx)) continue;
      seenStarts.add(braceOpenIdx);

      let depth = 0;
      let braceCloseIdx = braceOpenIdx;
      for (let k = braceOpenIdx; k < sanitizedCode.length; k++) {
        if (sanitizedCode[k] === '{') depth++;
        else if (sanitizedCode[k] === '}') {
          depth--;
          if (depth === 0) {
            braceCloseIdx = k;
            break;
          }
        }
      }

      const startLine = offsetToLine(match.index + (match[0].startsWith('\n') ? 1 : 0));
      const endLine = offsetToLine(braceCloseIdx);
      const sanSlice = sanLines.slice(startLine - 1, endLine).join('\n');
      const rawSlice = rawLines.slice(startLine - 1, endLine).join('\n');

      functions.push({
        name,
        startLine,
        endLine,
        loc: endLine - startLine + 1,
        complexity: computeCyclomaticComplexity(sanSlice, lang),
        maxNesting: computeMaxNesting(sanSlice, lang),
        sanitizedBody: sanSlice,
        preview: rawSlice
      });
    }
  }

  functions.sort((a, b) => a.startLine - b.startLine);
  return functions;
}

/**
 * Build directed intra-file call graph across detected functions.
 * @param {Array} functions
 * @returns {{ nodes: Array, edges: Array }}
 */
export function buildCallGraph(functions) {
  const names = new Set(functions.map((f) => f.name));
  const edgeMap = new Map();

  for (const fn of functions) {
    const bodyWithoutHeader = fn.sanitizedBody.split('\n').slice(1).join('\n');
    const callMatches = bodyWithoutHeader.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g);
    for (const m of callMatches) {
      const callee = m[1];
      if (callee !== fn.name && names.has(callee)) {
        const key = `${fn.name}->${callee}`;
        edgeMap.set(key, { from: fn.name, to: callee, weight: (edgeMap.get(key)?.weight || 0) + 1 });
      }
    }
  }

  const edges = Array.from(edgeMap.values());
  const inDegree = new Map();
  const outDegree = new Map();
  for (const e of edges) {
    outDegree.set(e.from, (outDegree.get(e.from) || 0) + 1);
    inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
  }

  const nodes = functions.map((fn) => ({
    id: fn.name,
    startLine: fn.startLine,
    endLine: fn.endLine,
    loc: fn.loc,
    complexity: fn.complexity,
    maxNesting: fn.maxNesting,
    inDegree: inDegree.get(fn.name) || 0,
    outDegree: outDegree.get(fn.name) || 0,
    severity: fn.complexity >= 11 || fn.maxNesting >= 4 ? 'eldritch' : fn.complexity >= 6 || fn.maxNesting >= 3 ? 'poltergeist' : 'sanctified'
  }));

  return { nodes, edges };
}

/**
 * Detect code smells ("Curses") with exact line numbers and exorcism advice.
 */
export function detectCurses(rawCode, sanitizedCode, functions, lang) {
  const curses = [];
  const rawLines = rawCode.split('\n');
  const sanLines = sanitizedCode.split('\n');

  for (const fn of functions) {
    if (fn.complexity >= 11) {
      curses.push({
        id: 'eldritch-complexity',
        severity: 'eldritch',
        title: `Eldritch Cyclomatic Complexity (${fn.complexity}) in \`${fn.name}()\``,
        line: fn.startLine,
        endLine: fn.endLine,
        fnName: fn.name,
        message: `Function \`${fn.name}\` branches ${fn.complexity} paths. High-branching monoliths breed edge-case regressions.`,
        remedy: 'Decompose into small single-purpose helpers, replace nested conditionals with early-return guard clauses or lookup tables.'
      });
    } else if (fn.complexity >= 6) {
      curses.push({
        id: 'poltergeist-complexity',
        severity: 'poltergeist',
        title: `Elevated Branching (${fn.complexity}) in \`${fn.name}()\``,
        line: fn.startLine,
        endLine: fn.endLine,
        fnName: fn.name,
        message: `Function \`${fn.name}\` has moderate branching complexity (${fn.complexity}).`,
        remedy: 'Extract conditional sub-blocks or parameterize repeated branches.'
      });
    }

    if (fn.maxNesting >= 4) {
      curses.push({
        id: 'abyssal-nesting',
        severity: 'eldritch',
        title: `Abyssal Nesting Depth (${fn.maxNesting}) in \`${fn.name}()\``,
        line: fn.startLine,
        endLine: fn.endLine,
        fnName: fn.name,
        message: `Pyramid of doom reaches depth ${fn.maxNesting} inside \`${fn.name}\`.`,
        remedy: 'Invert conditions for early returns and flatten async callbacks with async/await.'
      });
    }

    if (fn.loc >= 35) {
      curses.push({
        id: 'monolith-function',
        severity: 'poltergeist',
        title: `Undead Monolith (${fn.loc} lines) in \`${fn.name}()\``,
        line: fn.startLine,
        endLine: fn.endLine,
        fnName: fn.name,
        message: `Function \`${fn.name}\` spans ${fn.loc} lines, mixing orchestration with low-level details.`,
        remedy: 'Split validation, business rules, and formatting into cohesive helpers.'
      });
    }
  }

  for (let i = 0; i < sanLines.length; i++) {
    const sLine = sanLines[i];
    const rLine = rawLines[i] || '';
    const lineNum = i + 1;

    if (/\beval\s*\(/.test(sLine) || /\bnew\s+Function\s*\(/.test(sLine)) {
      curses.push({
        id: 'necrotic-eval',
        severity: 'eldritch',
        title: 'Necrotic Dynamic Execution (`eval` / `Function`)',
        line: lineNum,
        endLine: lineNum,
        message: 'Dynamic code evaluation opens severe injection and JIT optimization hazards.',
        remedy: 'Replace with explicit dispatch maps, JSON.parse, or safe expression evaluators.'
      });
    }

    if (lang === 'javascript' && /\bvar\s+[A-Za-z_$]/.test(sLine)) {
      curses.push({
        id: 'spectral-var',
        severity: 'mild',
        title: 'Legacy `var` Hoisting Phantom',
        line: lineNum,
        endLine: lineNum,
        message: '`var` leaks function-scoped bindings across blocks.',
        remedy: 'Migrate to block-scoped `const` (preferred) or `let`.'
      });
    }

    if (lang === 'javascript' && /catch\s*\([^)]*\)\s*\{\s*\}/.test(sLine)) {
      curses.push({
        id: 'silent-crypt-catch',
        severity: 'poltergeist',
        title: 'Silent Crypt (`catch` swallows errors)',
        line: lineNum,
        endLine: lineNum,
        message: 'Empty catch blocks hide runtime failures and make debugging impossible.',
        remedy: 'Log structured context or propagate a domain error.'
      });
    }

    if (lang === 'python' && /^\s*except\s*:/.test(sLine)) {
      curses.push({
        id: 'bare-except',
        severity: 'poltergeist',
        title: 'Bare `except:` Trap',
        line: lineNum,
        endLine: lineNum,
        message: 'Bare `except:` catches SystemExit and KeyboardInterrupt along with app errors.',
        remedy: 'Catch specific exception classes (e.g. `except ValueError as err:`).'
      });
    }

    if (/\b(TODO|FIXME|HACK|XXX)\b/.test(rLine)) {
      curses.push({
        id: 'tombstone-todo',
        severity: 'mild',
        title: 'Unresolved Tombstone (`TODO` / `FIXME`)',
        line: lineNum,
        endLine: lineNum,
        message: 'Deferred maintenance marker lingering in source comments.',
        remedy: 'Resolve the underlying task or track it in `.kiro/specs/`.'
      });
    }
  }

  const severityOrder = { eldritch: 0, poltergeist: 1, mild: 2 };
  curses.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.line - b.line);
  return curses;
}

/**
 * Compute bounded Curse Score [0, 100] and tier metadata.
 */
export function scoreCurses(functions, curses, totalLines) {
  if (totalLines === 0 || (functions.length === 0 && curses.length === 0)) {
    return { curseScore: 0, tier: HAUNT_TIERS[3] };
  }

  let points = 0;
  for (const c of curses) {
    if (c.severity === 'eldritch') points += 22;
    else if (c.severity === 'poltergeist') points += 11;
    else points += 4;
  }

  const maxComplexity = functions.reduce((m, f) => Math.max(m, f.complexity), 1);
  if (maxComplexity > 4) {
    points += Math.min(25, (maxComplexity - 4) * 2);
  }

  const curseScore = Math.max(0, Math.min(100, Math.round(points)));
  const tier = HAUNT_TIERS.find((t) => curseScore >= t.min) || HAUNT_TIERS[3];
  return { curseScore, tier };
}

/**
 * Full analysis entry point.
 * @param {string} rawCode
 * @param {{ filename?: string, language?: 'auto'|'javascript'|'python' }} [options]
 */
export function analyzeCode(rawCode, options = {}) {
  const code = typeof rawCode === 'string' ? rawCode : '';
  if (!code.trim()) {
    return {
      language: options.language && options.language !== 'auto' ? options.language : 'javascript',
      metrics: {
        totalLines: 0,
        codeLines: 0,
        commentLines: 0,
        commentRatio: 0,
        functionCount: 0,
        avgComplexity: 0,
        maxComplexity: 0,
        maxNesting: 0,
        curseCount: 0,
        curseScore: 0
      },
      tier: HAUNT_TIERS[3],
      functions: [],
      curses: [],
      graph: { nodes: [], edges: [] }
    };
  }

  const lang = options.language && options.language !== 'auto'
    ? options.language
    : detectLanguage(code, options.filename || '');

  const { sanitized, commentLines, codeLines, totalLines } = sanitizeCode(code, lang);
  const functions = extractFunctions(code, sanitized, lang);
  const curses = detectCurses(code, sanitized, functions, lang);
  const graph = buildCallGraph(functions);

  const avgComplexity = functions.length
    ? Number((functions.reduce((acc, f) => acc + f.complexity, 0) / functions.length).toFixed(2))
    : computeCyclomaticComplexity(sanitized, lang);

  const maxComplexity = functions.length
    ? Math.max(...functions.map((f) => f.complexity))
    : computeCyclomaticComplexity(sanitized, lang);

  const maxNesting = functions.length
    ? Math.max(...functions.map((f) => f.maxNesting))
    : computeMaxNesting(sanitized, lang);

  const { curseScore, tier } = scoreCurses(functions, curses, totalLines);

  return {
    language: lang,
    metrics: {
      totalLines,
      codeLines,
      commentLines,
      commentRatio: totalLines ? Number((commentLines / totalLines).toFixed(2)) : 0,
      functionCount: functions.length,
      avgComplexity,
      maxComplexity,
      maxNesting,
      curseCount: curses.length,
      curseScore
    },
    tier,
    functions,
    curses,
    graph
  };
}
