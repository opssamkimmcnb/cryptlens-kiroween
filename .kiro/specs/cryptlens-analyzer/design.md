# Design: CryptLens Haunted Static Analyzer

## Overview
CryptLens is architected as a zero-dependency client-side ES module application paired with pure Node-testable analysis modules.

## Module Architecture

```
index.html + styles.css (Gothic UI + Lantern Spotlight + Responsive Grid)
        │
        ▼
   src/app.js (Controller: Editor, File Drop, Tabs, Export, Exorcism Diff)
    ├── src/analyzer.js (Tokenizer, Function Extractor, Metrics, Call Graph)
    ├── src/exorcism.js (Refactor Diffs, Curse Delta Calculator, MD Export)
    ├── src/samples.js  (Curated Cursed + Purified Code Specimens)
    ├── src/graph.js    (HTML5 Canvas Spectral Graveyard & Particle Embers)
    └── src/audio.js    (Opt-in Web Audio API Ambient & Ritual Chimes)
```

## Key Algorithms
1. **Comment & String Sanitization (`sanitizeCode`)**:
   - Preserves newline offsets so every detected token/pattern retains its exact 1-based line number.
   - Handles JS/TS (`//`, `/* */`, `'...'`, `"..."`, `` `...` ``) and Python (`#`, `'''...'''`, `"""..."""`, `'...'`, `"..."`).
2. **Function Extraction & Scoping**:
   - Brace-depth tracking for JS/TS (`function foo()`, `const foo = (...) =>`, `async method()`).
   - Indentation-depth tracking for Python (`def foo(...):`, `async def foo(...):`).
3. **Cyclomatic Complexity**:
   - Base complexity `1` + decision branches (`if`, `else if` / `elif`, `for`, `while`, `case`, `catch` / `except`, `&&`, `||`, `??`, ternary `? :`).
4. **Call-Graph Construction**:
   - Scans each function's sanitized body for identifier call expressions `callee(` matching other extracted function names (excluding self-declaration).
5. **Property-Based Invariants**:
   - `curseScore` is always an integer in `[0, 100]`.
   - Every function's `complexity >= 1` and `endLine >= startLine >= 1`.
   - Adding pure comments never increases cyclomatic complexity.
