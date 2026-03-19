---
phase: 02-core-read-write-engine
plan: 01
subsystem: infra
tags: [typescript, interfaces, format-detection, path-sanitization, tdd, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "OmniReadError/OmniWriteError error classes, types (ReadOptions, WriteOptions), build toolchain"
provides:
  - IOBackend interface with readBytes, writeBytes, writeAtomic, readStream in src/backends/types.ts
  - FormatName type + Parser/Serializer interfaces in src/parsers/types.ts
  - detectFormat() function mapping file extensions to FormatName (case-insensitive, URL-aware, MIME hint)
  - sanitizePath() function rejecting directory traversal attacks with OmniReadError
affects: [03-parsers, 04-adapters, 05-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IOBackend defines the contract for all I/O backends (Node, Bun, Deno, browser)"
    - "FormatName as a string union type used as parser registry key"
    - "MIME type hint as optional second arg to detectFormat for Blob/File browser scenarios"
    - "sanitizePath normalizes backslashes before segment-splitting for cross-platform traversal detection"

key-files:
  created:
    - src/backends/types.ts
    - src/parsers/types.ts
    - src/format.ts
    - src/format.test.ts
    - src/sanitize.ts
    - src/sanitize.test.ts
  modified:
    - src/env.ts

key-decisions:
  - "detectFormat MIME hint only resolves known MIME types; unknown MIME (e.g. application/octet-stream) falls back to extension detection"
  - "sanitizePath returns original (non-normalized) path on success to preserve caller intent for the actual FS call"
  - "sanitizePath passes URLs through without traversal checks (no fs path risk)"
  - "Removed duplicate process declare global from env.ts to fix TS2403 conflict with TypeScript 5.9 built-in Process type"

patterns-established:
  - "TDD pattern: write failing tests first, implement to make them pass, then run lint/format"
  - "Format detection: MIME hint checked first, falls back to extension — enables browser Blob/File usage"
  - "Path security: normalize backslashes to forward slashes before segment-based .. detection"

requirements-completed: [CORE-07, SRV-02]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 2 Plan 01: Core Contracts, Format Detector, and Path Sanitization Summary

**IOBackend/Parser/Serializer interfaces with extension-to-format mapping (URL-aware, MIME-hint-capable) and directory-traversal-rejecting sanitizePath, tested with 39 cases across both files**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T16:49:51Z
- **Completed:** 2026-03-19T16:54:05Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- IOBackend interface defining the contract all runtime backends implement (readBytes, writeBytes, writeAtomic, optional readStream)
- FormatName type and Parser/Serializer generic interfaces in src/parsers/types.ts — the parser registry key type
- detectFormat() maps 9 extensions to 5 format names, case-insensitive, handles full URLs (strips pathname), and accepts optional MIME type hint for browser Blob/File scenarios
- sanitizePath() rejects empty paths and all directory traversal variants (forward-slash, backslash, nested) while passing safe paths and URLs through unchanged
- 39 tests total (23 for format, 16 for sanitize), all passing; lint clean; build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Define Backend/Parser interfaces and implement format detector** - `8db1c26` (feat)
2. **Task 2: Implement path sanitization with traversal rejection** - `6239f00` (feat)

**Plan metadata:** *(docs commit to follow)*

## Files Created/Modified

- `src/backends/types.ts` - IOBackend interface with readBytes, writeBytes, writeAtomic, readStream
- `src/parsers/types.ts` - FormatName type, Parser and Serializer generic interfaces
- `src/format.ts` - detectFormat() with extension map, MIME map, URL pathname extraction
- `src/format.test.ts` - 23 tests: known extensions, unknowns, case-insensitivity, URLs, MIME hints
- `src/sanitize.ts` - sanitizePath() with empty-path and traversal rejection, URL pass-through
- `src/sanitize.test.ts` - 16 tests: safe paths, URL pass-through, traversal variants, OmniReadError.path
- `src/env.ts` - Removed duplicate `process` declare global that conflicted with TypeScript 5.9

## Decisions Made

- detectFormat MIME hint only short-circuits on explicitly known MIME types; `application/octet-stream` falls back to extension detection (most correct behavior for generic binary blobs)
- sanitizePath returns the original (non-normalized) path on success so the caller's path string is preserved exactly for the downstream FS call — normalization is only done internally for traversal detection
- URLs pass through sanitizePath without traversal checks since there is no filesystem path component risk in a URL string

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TS2403 TypeScript error in env.ts from duplicate process declaration**
- **Found during:** Task 2 (build verification)
- **Issue:** TypeScript 5.9 added a built-in `Process` type declaration for `process` global. The existing `declare global { var process: { versions?: ... } }` in env.ts conflicted, causing `TS2403: Subsequent variable declarations must have the same type`
- **Fix:** Removed the `process` declaration from the `declare global` block in env.ts; the TypeScript 5.9 built-in Process type has a compatible `versions.node` property, so the check `process?.versions?.node` still compiles
- **Files modified:** src/env.ts
- **Verification:** `npx tsc --noEmit` passes, `pnpm build` succeeds, all 72 tests pass
- **Committed in:** 6239f00 (Task 2 commit)

**2. [Rule 1 - Bug] Auto-formatted pre-existing src/parsers/csv.ts via biome format**
- **Found during:** Task 2 (lint verification)
- **Issue:** Pre-existing src/parsers/csv.ts had lines exceeding biome's print width; `pnpm lint` failed because biome checks all files in src/
- **Fix:** Ran `pnpm format` which auto-reformatted csv.ts (and sanitize.test.ts) to fix line-length violations
- **Files modified:** src/parsers/csv.ts (pre-existing file)
- **Verification:** `pnpm lint` passes with zero errors after formatting
- **Committed in:** 8db1c26 (Task 1 commit included the pre-existing csv.ts and text.ts formatting fixes)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug category)
**Impact on plan:** Both fixes necessary for build correctness and lint compliance. No scope creep — all fixes directly blocked completion of planned tasks.

## Issues Encountered

- TypeScript 5.9.3 introduced a built-in `Process` type that conflicted with the hand-rolled `process` declaration in env.ts — resolved by removing the now-redundant declaration

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- IOBackend interface ready for Node.js and Bun backend implementations
- Parser/Serializer interfaces ready for text, JSON, CSV, TSV, XML parser implementations
- detectFormat() ready to be called in the read/write orchestration layer to select the right parser
- sanitizePath() ready to be called as the first validation step in read/write operations
- FormatName type ensures the parser registry is fully typed

## Self-Check: PASSED

- src/backends/types.ts: FOUND
- src/parsers/types.ts: FOUND
- src/format.ts: FOUND
- src/format.test.ts: FOUND
- src/sanitize.ts: FOUND
- src/sanitize.test.ts: FOUND
- .planning/phases/02-core-read-write-engine/02-01-SUMMARY.md: FOUND
- Commit 8db1c26: FOUND
- Commit 6239f00: FOUND

---
*Phase: 02-core-read-write-engine*
*Completed: 2026-03-19*
