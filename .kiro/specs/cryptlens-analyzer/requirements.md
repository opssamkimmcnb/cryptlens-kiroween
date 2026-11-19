# Requirements: CryptLens Haunted Static Analyzer

## Introduction
CryptLens transforms static code complexity and smell analysis into a spooky, interactive graveyard and spectral call-graph profiler for JavaScript, TypeScript, and Python source files.

## Requirements

### Requirement 1: Deterministic Static Code Analysis
**User Story:** As a developer, I want to paste or upload source code and immediately receive accurate static metrics so that I can identify high-risk functions.

#### Acceptance Criteria
1. WHEN source code is submitted for analysis, THE Analyzer SHALL strip comments and string literals before counting decision points so that keywords inside comments/strings do not inflate cyclomatic complexity.
2. WHEN valid JavaScript, TypeScript, or Python functions are present, THE Analyzer SHALL extract each function's name, start line, end line, line count, maximum nesting depth, and cyclomatic complexity.
3. WHEN empty or whitespace-only input is provided, THE Analyzer SHALL return zero functions, zero curses, and a Curse Index of `0` without throwing exceptions.

### Requirement 2: Curse Severity & Anti-Pattern Detection
**User Story:** As a developer, I want concrete anti-patterns surfaced as "Curses" with line numbers and refactoring advice so that I know how to clean up legacy code.

#### Acceptance Criteria
1. WHEN a function exceeds a cyclomatic complexity of 10 or nesting depth of 4, THE Analyzer SHALL emit a `Poltergeist` or `Eldritch` curse diagnostic referencing the exact line range.
2. WHEN unsafe or legacy patterns (`eval(`, `var `, empty `catch`, `TODO`/`FIXME` tombs, deeply nested callbacks, or `except:` bare handlers) appear outside comments, THE Analyzer SHALL classify them with severity, line number, and remediation guidance.
3. THE Analyzer SHALL compute a bounded overall `curseScore` in `[0, 100]` and a human-readable haunt tier (`Sanctified`, `Mild Haunt`, `Poltergeist`, `Eldritch Horror`).

### Requirement 3: Spectral Call-Graph & Graveyard Canvas
**User Story:** As a judge or user, I want to explore function relationships visually in a haunted graveyard canvas so that spooky aesthetics directly reveal architectural bottlenecks.

#### Acceptance Criteria
1. WHEN functions call other detected functions in the same file, THE Analyzer SHALL construct directed call-graph edges between caller and callee nodes.
2. WHEN the user clicks or hovers a tombstone node on the canvas, THE UI SHALL highlight connected edges and display that function's metrics, smells, and source preview.

### Requirement 4: Exorcism Mode & Audit Export
**User Story:** As a developer, I want to compare cursed code against an exorcised refactor and export an audit report so that I can verify complexity reduction.

#### Acceptance Criteria
1. WHEN a built-in haunted specimen or refactorable snippet is exorcised, THE UI SHALL display a side-by-side comparison and compute the percentage reduction in Curse Score and Cyclomatic Complexity.
2. WHEN the user clicks Export Audit, THE UI SHALL generate a valid Markdown report summarizing metrics, detected curses, and function hotspots.
