import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCode,
  sanitizeCode,
  computeCyclomaticComplexity
} from '../src/analyzer.js';
import { compareExorcism, exportMarkdownReport } from '../src/exorcism.js';
import { SPECIMENS } from '../src/samples.js';

test('empty or whitespace input returns zeroed metrics without throwing', () => {
  for (const input of ['', '   \n\t  ']) {
    const res = analyzeCode(input);
    assert.equal(res.metrics.curseScore, 0);
    assert.equal(res.metrics.functionCount, 0);
    assert.equal(res.curses.length, 0);
    assert.equal(res.tier.id, 'sanctified');
  }
});

test('comments and string literals do not inflate cyclomatic complexity', () => {
  const baseline = 'function greet(name) { return "hello " + name; }';
  const withFakeBranchesInComments = `
    // if (a && b || c) { for (let i=0;i<10;i++) {} }
    /* while (true) { if (x) {} } */
    function greet(name) {
      const msg = "if (a && b) while (c) for (d)";
      return msg + name;
    }
  `;
  const r1 = analyzeCode(baseline);
  const r2 = analyzeCode(withFakeBranchesInComments);
  assert.equal(r1.metrics.maxComplexity, 1);
  assert.equal(r2.metrics.maxComplexity, 1);

  const san = sanitizeCode(withFakeBranchesInComments, 'javascript');
  assert.equal(computeCyclomaticComplexity(san.sanitized, 'javascript'), 1);
});

test('detects high complexity, eval, var, empty catch, and call-graph edges in JS', () => {
  const specimen = SPECIMENS.find((s) => s.id === 'haunted-auth');
  const res = analyzeCode(specimen.cursedCode, { language: 'javascript' });

  assert.equal(res.metrics.functionCount, 3);
  assert.ok(res.metrics.curseScore >= 60, `Expected high curseScore, got ${res.metrics.curseScore}`);
  assert.ok(res.curses.some((c) => c.id === 'necrotic-eval'));
  assert.ok(res.curses.some((c) => c.id === 'silent-crypt-catch'));
  assert.ok(res.curses.some((c) => c.id === 'spectral-var'));

  const edgeKeys = new Set(res.graph.edges.map((e) => `${e.from}->${e.to}`));
  assert.ok(edgeKeys.has('authenticateRitual->decodePhantomToken'));
  assert.ok(edgeKeys.has('authenticateRitual->hasValidSigil'));
});

test('extracts Python functions and detects bare except traps', () => {
  const specimen = SPECIMENS.find((s) => s.id === 'python-telemetry');
  const res = analyzeCode(specimen.cursedCode, { filename: 'telemetry.py' });

  assert.equal(res.language, 'python');
  assert.equal(res.metrics.functionCount, 4);
  assert.ok(res.curses.some((c) => c.id === 'bare-except'));
  const edgeKeys = new Set(res.graph.edges.map((e) => `${e.from}->${e.to}`));
  assert.ok(edgeKeys.has('ingest_telemetry->normalize_event'));
  assert.ok(edgeKeys.has('ingest_telemetry->score_anomaly'));
  assert.ok(edgeKeys.has('ingest_telemetry->emit_alert'));
});

test('exorcism specimens strictly reduce curseScore and complexity', () => {
  for (const s of SPECIMENS) {
    const cmp = compareExorcism(s.cursedCode, s.purifiedCode, s.language);
    assert.ok(
      cmp.after.metrics.curseScore < cmp.before.metrics.curseScore,
      `Specimen ${s.id} should lower curseScore (${cmp.before.metrics.curseScore} -> ${cmp.after.metrics.curseScore})`
    );
    assert.ok(cmp.delta.curseReductionPct > 0);
  }
});

test('Markdown audit export includes tier, functions, and remedies', () => {
  const report = analyzeCode(SPECIMENS[0].cursedCode, { language: 'javascript' });
  const md = exportMarkdownReport(report, 'AuthGate.js');
  assert.match(md, /# CryptLens Haunted Code Audit — AuthGate\.js/);
  assert.match(md, /authenticateRitual\(\)/);
  assert.match(md, /Detected Curses/);
});

test('property-based invariant: curseScore is bounded [0, 100] and line ranges are valid', () => {
  const fragments = [
    'function f(x) { if (x) { return 1; } return 0; }',
    'const g = (a, b) => { if (a && b) { for (let i = 0; i < 3; i++) { eval("1"); } } };',
    'var z = 1; try { z++; } catch (e) {}',
    '// TODO: fix\n'
  ];

  for (let seed = 1; seed <= 25; seed++) {
    let snippet = '';
    for (let k = 0; k < (seed % 5) + 1; k++) {
      snippet += fragments[(seed + k) % fragments.length].replace(/f\(/g, `f${seed}_${k}(`).replace(/g =/g, `g${seed}_${k} =`) + '\n';
    }
    const res = analyzeCode(snippet, { language: 'javascript' });
    assert.ok(res.metrics.curseScore >= 0 && res.metrics.curseScore <= 100);
    for (const fn of res.functions) {
      assert.ok(fn.complexity >= 1);
      assert.ok(fn.startLine >= 1 && fn.endLine >= fn.startLine);
    }
  }
});
