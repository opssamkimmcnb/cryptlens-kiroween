# Implementation Tasks

- [x] 1. Initialize project skeleton, MIT `LICENSE`, and `.kiro` steering/hooks/specs
- [x] 2. Implement pure static analyzer in `src/analyzer.js`
  - [x] 2.1 Implement line-preserving comment & string sanitizer for JS/TS/Python
  - [x] 2.2 Implement function boundary extraction (brace-based and indentation-based)
  - [x] 2.3 Compute cyclomatic complexity, max nesting depth, LOC, and call-graph edges
  - [x] 2.4 Implement anti-pattern / curse diagnostics and bounded `curseScore`
- [x] 3. Implement exorcism & audit module in `src/exorcism.js` and specimens in `src/samples.js`
  - [x] 3.1 Create 3 multi-language haunted specimens with purified refactored versions
  - [x] 3.2 Implement complexity delta computation and Markdown ritual report generator
- [x] 4. Build interactive Spectral Graveyard Canvas in `src/graph.js` and Web Audio synthesizer in `src/audio.js`
- [x] 5. Build gothic responsive UI (`index.html`, `styles.css`, `src/app.js`) with lantern spotlight, file drag-and-drop, exorcism diff view, and keyboard shortcuts
- [x] 6. Write unit and property-based tests in `tests/analyzer.test.js` and verify all tests pass
- [x] 7. Record live browser demonstration video (`< 3 min`) and finalize `README.md`
