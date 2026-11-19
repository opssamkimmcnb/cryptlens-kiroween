---
inclusion: always
---

# Repository Structure

- `.kiro/` — Kiro steering docs, automation hooks, and spec-driven development artifacts (must remain tracked in git).
- `src/analyzer.js` — Deterministic static parser, cyclomatic complexity, nesting depth, function extractor, smell detector, and call-graph builder.
- `src/exorcism.js` — Refactoring advisor, cursed-vs-purified diff generator, and Markdown audit report exporter.
- `src/samples.js` — Curated multi-language haunted code specimens for instant exploration.
- `src/graph.js` — Interactive HTML5 Canvas Graveyard & Spectral Call-Graph renderer (pan, hover, click-to-inspect).
- `src/audio.js` — Synthesized Web Audio feedback (muted by default).
- `src/app.js` — Application state, DOM binding, drag-and-drop file upload, and lantern cursor spotlight.
- `tests/` — Automated unit and property-based tests runnable via `npm test`.
