# 🕯️ CryptLens — Haunted Code Archaeologist & Complexity Profiler

**Kiroween 2026 Hackathon Submission — Costume Contest Category**

CryptLens turns static code complexity auditing and anti-pattern detection into an atmospheric haunted graveyard exploration experience—without sacrificing deterministic analytical precision.

> Zero backend, zero API keys, zero external runtime dependencies. Runs 100% client-side in your browser or via any static web server.

---

## ✨ Features

- **Deterministic Static Analyzer (`src/analyzer.js`)**:
  - Line-preserving comment & string sanitization for **JavaScript / TypeScript** and **Python** so keywords inside strings or comments never inflate metrics.
  - Per-function **Cyclomatic Complexity**, **Maximum Nesting Depth**, **LOC**, and **Intra-File Call Graph** extraction.
  - **Curse Diagnostics**: Detects `eval()` / `new Function()`, legacy `var` hoisting, silent empty `catch` blocks, Python bare `except:` traps, abyssal nesting pyramids, monolith functions, and unresolved `TODO`/`FIXME` tombstones.
  - Bounded **Curse Score (`0–100`)** mapped to four haunt tiers: `Sanctified`, `Mild Haunt`, `Poltergeist`, and `Eldritch Horror`.
- **Interactive Spectral Graveyard Canvas (`src/graph.js`)**:
  - Each function appears as a glowing tombstone styled by curse severity with floating ectoplasm embers.
  - Click any tombstone to highlight incoming/outgoing call wisps and inspect its metrics and source preview.
- **Exorcism Ritual & Side-by-Side Diff (`src/exorcism.js`)**:
  - Transform cursed specimens into clean, guard-clause-driven refactors and inspect exact percentage drops in Curse Score and Cyclomatic Complexity.
- **Markdown Ritual Audit Export**:
  - Download a clean `cryptlens-audit-report.md` summary for PRs or technical debt tracking.
- **Atmospheric Controls**:
  - Toggleable cursor **Lantern Spotlight** and opt-in (muted by default) **Web Audio API** spectral chimes (`src/audio.js`).

---

## 🚀 Quick Start

### Run Locally
```bash
# Using Python's built-in static server
python3 -m http.server 4173
# Or Node
npm run serve
```
Then open `http://localhost:4173` in your browser.

### Run Automated Tests
```bash
npm test
# or
node --test tests/*.test.js
```

---

## 🤖 How Kiro Was Used

This project includes the full `.kiro/` workspace configuration at the repository root:

- **Steering (`.kiro/steering/`)**: `product.md`, `tech.md`, and `structure.md` establish zero-dependency client-side execution, pure Node-testable analyzer modules, and functional spooky UI principles.
- **Spec-Driven Development (`.kiro/specs/cryptlens-analyzer/`)**:
  - `requirements.md`: Formal EARS-style acceptance criteria for sanitization, complexity, curses, call-graph, and exorcism deltas.
  - `design.md`: Architecture diagram, tokenizer/scoping design, and property-based invariants.
  - `tasks.md`: Sequenced implementation checklist.
- **Agent Hooks (`.kiro/hooks/`)**:
  - `run-tests-on-save.json`: Automatically runs `node --test tests/*.test.js` on edits to `src/*.js` or `tests/*.js`.
  - `verify-kiro-dir.json`: Ensures `.gitignore` never excludes `.kiro/`.

---

## 📁 Project Structure

```text
├── .kiro/
│   ├── hooks/
│   ├── specs/cryptlens-analyzer/
│   └── steering/
├── demo/
│   └── cryptlens-demo.mp4
├── src/
│   ├── analyzer.js
│   ├── app.js
│   ├── audio.js
│   ├── exorcism.js
│   ├── graph.js
│   └── samples.js
├── tests/
│   └── analyzer.test.js
├── index.html
├── styles.css
├── LICENSE
└── package.json
```

---

## 📄 License

Licensed under the [MIT License](LICENSE).
