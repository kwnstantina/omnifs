# Roadmap: OmniFS

## Overview

Four phases deliver the isomorphic file engine from zero to published library. Phase 1 establishes the project skeleton and build toolchain. Phase 2 builds the core read/write engine across all four runtimes. Phase 3 adds the XLSX/DOCX lite binary drivers that differentiate OmniFS. Phase 4 wraps the core with framework adapters and ships documentation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Project scaffold, build toolchain, environment detection, dual ESM/CJS output
- [ ] **Phase 2: Core Read/Write Engine** - Unified read()/write() across all runtimes with smart format detection, streaming, and server hardening
- [ ] **Phase 3: Lite Binary Drivers** - XLSX and DOCX lite parsing via fflate (~8KB), image handling, graceful fallback errors
- [ ] **Phase 4: Framework Adapters & Docs** - React/Vue/Svelte reactive adapters, tree-shakeable entry points, README and API reference

## Phase Details

### Phase 1: Foundation
**Goal**: A working library skeleton that builds, tests, and exports correctly across ESM and CJS consumers
**Depends on**: Nothing (first phase)
**Requirements**: ENV-01, BUILD-01, BUILD-02, BUILD-03, BUILD-04
**Success Criteria** (what must be TRUE):
  1. `import { read } from 'omnifs'` works in an ESM consumer project without errors
  2. `const { read } = require('omnifs')` works in a CJS consumer project without errors
  3. TypeScript consumers see full type definitions with no `any` leakage on public API
  4. CI validates exports map with publint and reports broken entry points
  5. Environment detector correctly identifies Node, Bun, Deno, and Browser at runtime
**Plans**: 2 plans

Plans:
- [x] 01-01: Project scaffold, tsup config, dual ESM/CJS build with exports map
- [ ] 01-02: Environment detector and CI setup (vitest, publint, bundle size gate)

### Phase 2: Core Read/Write Engine
**Goal**: Users can read and write all common file formats from any supported runtime with zero configuration
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, ENV-02, ENV-03, ENV-04, ENV-05, ENV-06, ENV-07, SRV-01, SRV-02
**Success Criteria** (what must be TRUE):
  1. `read('file.json')` returns a parsed JS object in Node, Bun, and Deno without any configuration
  2. `read('data.csv')` returns an array of arrays in all server runtimes and in the browser via fetch URL
  3. `read(fileInputBlob)` returns parsed data in the browser from a File/Blob object
  4. `write('output.json', { key: 'value' })` serializes and saves correctly; `write('output.csv', rows)` serializes to CSV
  5. `stream('large.csv')` returns a ReadableStream that emits rows without loading the full file into memory
  6. Server writes use atomic temp-write then rename; path inputs containing `../` are rejected with a clear error
**Plans**: TBD

Plans:
- [ ] 02-01: I/O backends for Node, Bun, Deno (read/write/atomic write/path sanitization)
- [ ] 02-02: Browser backends (fetch URL, FileReader for Blob, download trigger for write)
- [ ] 02-03: Parsers/serializers (text, JSON, CSV/TSV via papaparse), format detector, streaming support

### Phase 3: Lite Binary Drivers
**Goal**: Users can extract content from XLSX and DOCX files using a driver that stays under 8KB, with graceful errors for unsupported complexity
**Depends on**: Phase 2
**Requirements**: BIN-01, BIN-02, BIN-03, BIN-04
**Success Criteria** (what must be TRUE):
  1. `read('spreadsheet.xlsx')` returns row data from a simple XLSX file without any additional dependencies
  2. `read('document.docx')` returns extracted paragraph text from a simple DOCX file
  3. `read('photo.png')` returns a base64 string on server or a blob URL in the browser
  4. Reading a complex XLSX with charts throws an error that names a full-featured alternative to install
  5. CI enforces the lite binary driver bundle stays under 8KB gzipped
**Plans**: TBD

Plans:
- [ ] 03-01: XLSX and DOCX lite drivers (fflate + fast-xml-parser, size-limit CI gate)
- [ ] 03-02: Image driver and fallback error system

### Phase 4: Framework Adapters & Docs
**Goal**: React, Vue, and Svelte users can consume OmniFS through reactive primitives from separate tree-shakeable entry points, and the library is fully documented
**Depends on**: Phase 3
**Requirements**: FW-01, FW-02, FW-03, DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. `import { useFile } from 'omnifs/react'` gives a React hook returning `{ data, loading, error }` that re-fetches on path change
  2. `import { useFileVue } from 'omnifs/vue'` gives a Vue composable with reactive refs
  3. `import { fileStore } from 'omnifs/svelte'` gives a Svelte store that integrates with `$store` syntax
  4. A project that only imports `omnifs/react` does not bundle the Vue or Svelte adapter code
  5. README covers installation and working examples for every supported format and framework adapter
**Plans**: TBD

Plans:
- [ ] 04-01: React, Vue, and Svelte adapters with separate entry points
- [ ] 04-02: README, API reference, and usage examples

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/2 | In progress | - |
| 2. Core Read/Write Engine | 0/3 | Not started | - |
| 3. Lite Binary Drivers | 0/2 | Not started | - |
| 4. Framework Adapters & Docs | 0/2 | Not started | - |
