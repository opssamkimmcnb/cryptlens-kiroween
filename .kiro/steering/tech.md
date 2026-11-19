---
inclusion: always
---

# Technical Stack & Standards

## Architecture
- **Frontend**: Vanilla ES2022 Modules (`index.html`, `styles.css`, `src/*.js`) with HTML5 Canvas for interactive graph/graveyard rendering and optional Web Audio API synthesis.
- **Zero External Runtime Dependencies**: No bundler or npm runtime dependencies required; works directly over HTTP/HTTPS static hosting (GitHub Pages compatible).
- **Testing**: Built-in Node.js test runner (`node --test tests/*.test.js`) supporting both unit tests and property-based invariants.

## Coding Conventions
- Pure, side-effect-free analysis functions in `src/analyzer.js` and `src/exorcism.js` so they run identically in browser and Node.js test environments.
- Keep functions modular with shallow nesting and explicit edge-case handling (empty input, unbalanced braces, comments/strings containing keywords).
- Never depend on external fonts/CDNs that fail offline—always provide clean system fallbacks.
