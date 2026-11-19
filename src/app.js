import { analyzeCode } from './analyzer.js';
import { compareExorcism, exportMarkdownReport } from './exorcism.js';
import { SPECIMENS } from './samples.js';
import { GraveyardGraph } from './graph.js';
import { spectralAudio } from './audio.js';

const els = {
  codeInput: document.getElementById('code-input'),
  specimenSelect: document.getElementById('specimen-select'),
  langSelect: document.getElementById('lang-select'),
  fileInput: document.getElementById('file-input'),
  dropZone: document.getElementById('drop-zone'),
  fileMeta: document.getElementById('file-meta'),
  btnAnalyze: document.getElementById('btn-analyze'),
  btnExorcise: document.getElementById('btn-exorcise'),
  btnExport: document.getElementById('btn-export'),
  btnLantern: document.getElementById('btn-lantern'),
  lanternState: document.getElementById('lantern-state'),
  btnAudio: document.getElementById('btn-audio'),
  audioState: document.getElementById('audio-state'),
  metricScore: document.getElementById('metric-score'),
  metricTier: document.getElementById('metric-tier'),
  metricFuncs: document.getElementById('metric-funcs'),
  metricCc: document.getElementById('metric-cc'),
  metricNesting: document.getElementById('metric-nesting'),
  metricCurses: document.getElementById('metric-curses'),
  nodeInspector: document.getElementById('node-inspector'),
  cursesList: document.getElementById('curses-list'),
  exorcismSummary: document.getElementById('exorcism-summary'),
  diffBefore: document.getElementById('diff-before'),
  diffAfter: document.getElementById('diff-after'),
  statusToast: document.getElementById('status-toast'),
  tabButtons: Array.from(document.querySelectorAll('.tab-btn')),
  tabPanes: Array.from(document.querySelectorAll('.tab-pane'))
};

let currentReport = null;
let currentSpecimen = SPECIMENS[0];
let currentFilename = `${SPECIMENS[0].name}`;

const graph = new GraveyardGraph(document.getElementById('graveyard-canvas'), (nodeId) => {
  renderNodeInspector(nodeId);
  if (nodeId) spectralAudio.playChime(440, 0.1, 'sine');
});

function showToast(msg) {
  els.statusToast.textContent = msg;
  setTimeout(() => {
    if (els.statusToast.textContent === msg) {
      els.statusToast.textContent = '';
    }
  }, 3200);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function switchTab(tabId) {
  for (const btn of els.tabButtons) {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  }
  for (const pane of els.tabPanes) {
    pane.classList.toggle('active', pane.id === `tab-${tabId}`);
  }
}

function renderNodeInspector(nodeId) {
  if (!currentReport || !nodeId) {
    els.nodeInspector.innerHTML = '<p class="muted">Click any tombstone node above to inspect its complexity, call edges, and source lines.</p>';
    return;
  }

  const fn = currentReport.functions.find((f) => f.name === nodeId);
  if (!fn) return;

  const outgoing = currentReport.graph.edges.filter((e) => e.from === nodeId).map((e) => `${e.to}()`).join(', ') || 'None';
  const incoming = currentReport.graph.edges.filter((e) => e.to === nodeId).map((e) => `${e.from}()`).join(', ') || 'Entry / External';

  els.nodeInspector.innerHTML = `
    <div class="inspector-header">
      <strong>† <code>${escapeHtml(fn.name)}()</code> · L${fn.startLine}–L${fn.endLine}</strong>
      <span class="meta-text">Cyclomatic: <strong>${fn.complexity}</strong> · Nesting: <strong>${fn.maxNesting}</strong> · LOC: <strong>${fn.loc}</strong></span>
    </div>
    <div class="meta-text">Calls: ${escapeHtml(outgoing)} &nbsp;|&nbsp; Called by: ${escapeHtml(incoming)}</div>
    <pre class="inspector-code">${escapeHtml(fn.preview.split('\n').slice(0, 12).join('\n'))}</pre>
  `;
}

function renderCurses(curses) {
  if (!curses.length) {
    els.cursesList.innerHTML = `
      <div class="curse-item" style="border-left-color: var(--accent-ecto);">
        <div class="curse-top"><span>✦ Sanctified Codebase — Zero Curses Detected</span></div>
        <p class="curse-msg">All detected functions stay within healthy cyclomatic complexity and nesting thresholds.</p>
      </div>
    `;
    return;
  }

  els.cursesList.innerHTML = curses.map((c) => `
    <article class="curse-item ${c.severity}">
      <div class="curse-top">
        <span>${escapeHtml(c.title)}</span>
        <span class="curse-line">Line ${c.line}${c.endLine > c.line ? `–${c.endLine}` : ''}</span>
      </div>
      <p class="curse-msg">${escapeHtml(c.message)}</p>
      <p class="curse-remedy"><strong>Exorcism Remedy:</strong> ${escapeHtml(c.remedy)}</p>
    </article>
  `).join('');
}

function runAnalysis({ playSound = false } = {}) {
  const code = els.codeInput.value;
  const language = els.langSelect.value;
  const report = analyzeCode(code, { filename: currentFilename, language });
  currentReport = report;

  const { metrics, tier } = report;
  els.metricScore.textContent = String(metrics.curseScore);
  els.metricScore.style.color = tier.color;
  els.metricTier.textContent = tier.label;
  els.metricTier.style.color = tier.color;
  els.metricFuncs.textContent = String(metrics.functionCount);
  els.metricCc.textContent = String(metrics.maxComplexity);
  els.metricNesting.textContent = String(metrics.maxNesting);
  els.metricCurses.textContent = String(metrics.curseCount);

  graph.setData(report.graph);
  renderNodeInspector(graph.selectedId);
  renderCurses(report.curses);

  if (playSound) {
    spectralAudio.playRitual(metrics.curseScore);
  }
  showToast(`Analyzed ${metrics.totalLines} lines (${report.language}) · Curse Score ${metrics.curseScore}/100`);
}

function performExorcism() {
  const specimen = currentSpecimen;
  if (!specimen) return;

  const comparison = compareExorcism(els.codeInput.value, specimen.purifiedCode, els.langSelect.value);
  const { before, after, delta } = comparison;

  els.exorcismSummary.innerHTML = `
    <strong>✦ Exorcism Ritual Complete:</strong>
    Curse Score dropped from <strong>${before.metrics.curseScore}</strong> → <strong>${after.metrics.curseScore}</strong>
    (<strong>-${delta.curseReductionPct}%</strong>) ·
    Max Complexity <strong>${before.metrics.maxComplexity}</strong> → <strong>${after.metrics.maxComplexity}</strong> ·
    Curses Eliminated: <strong>${Math.max(0, delta.cursesEliminated)}</strong>
  `;
  els.diffBefore.textContent = els.codeInput.value;
  els.diffAfter.textContent = specimen.purifiedCode;

  // Apply purified code into editor and re-run live analysis
  els.codeInput.value = specimen.purifiedCode;
  currentFilename = `${specimen.name} (Exorcised)`;
  els.fileMeta.textContent = `Exorcised: ${specimen.name}`;
  runAnalysis({ playSound: true });
  switchTab('exorcism');
}

function loadSpecimen(specimenId) {
  const found = SPECIMENS.find((s) => s.id === specimenId) || SPECIMENS[0];
  currentSpecimen = found;
  currentFilename = found.name;
  els.codeInput.value = found.cursedCode;
  els.langSelect.value = found.language;
  els.fileMeta.textContent = `Loaded: ${found.name} — ${found.description}`;
  runAnalysis();
}

// Event bindings
els.specimenSelect.addEventListener('change', (e) => {
  loadSpecimen(e.target.value);
});

els.langSelect.addEventListener('change', () => runAnalysis());
els.btnAnalyze.addEventListener('click', () => runAnalysis({ playSound: true }));
els.btnExorcise.addEventListener('click', performExorcism);

els.btnExport.addEventListener('click', () => {
  if (!currentReport) return;
  const md = exportMarkdownReport(currentReport, currentFilename);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cryptlens-audit-report.md';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported cryptlens-audit-report.md');
});

els.btnLantern.addEventListener('click', () => {
  const off = document.body.classList.toggle('lantern-off');
  els.lanternState.textContent = off ? 'OFF' : 'ON';
});

els.btnAudio.addEventListener('click', () => {
  const next = !spectralAudio.enabled;
  spectralAudio.setEnabled(next);
  els.audioState.textContent = next ? 'ON' : 'OFF';
});

for (const btn of els.tabButtons) {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
}

els.fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  currentFilename = file.name;
  els.langSelect.value = 'auto';
  els.codeInput.value = text;
  els.fileMeta.textContent = `Uploaded: ${file.name} (${file.size} bytes)`;
  runAnalysis({ playSound: true });
});

['dragenter', 'dragover'].forEach((evt) => {
  els.dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    els.dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((evt) => {
  els.dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('drag-over');
  });
});

els.dropZone.addEventListener('drop', async (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const text = await file.text();
  currentFilename = file.name;
  els.langSelect.value = 'auto';
  els.codeInput.value = text;
  els.fileMeta.textContent = `Dropped: ${file.name} (${file.size} bytes)`;
  runAnalysis({ playSound: true });
});

window.addEventListener('mousemove', (e) => {
  document.documentElement.style.setProperty('--lantern-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--lantern-y', `${e.clientY}px`);
});

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    runAnalysis({ playSound: true });
  }
});

// Initialize default haunted specimen
loadSpecimen(SPECIMENS[0].id);
