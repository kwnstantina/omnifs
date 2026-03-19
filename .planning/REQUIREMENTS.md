# Requirements: OmniFS

**Defined:** 2026-03-19
**Core Value:** A single read()/write() call that just works — any file format, any JS runtime, any environment — with zero configuration.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core I/O

- [x] **CORE-01**: User can read a text file and receive a clean UTF-8 string with BOM stripped
- [x] **CORE-02**: User can read a JSON file and receive a parsed JavaScript object/array
- [x] **CORE-03**: User can read a CSV file and receive a parsed array of arrays
- [x] **CORE-04**: User can read a TSV file and receive a parsed array of arrays
- [ ] **CORE-05**: User can write data to a file with auto-serialization based on extension (object → JSON, array → CSV)
- [ ] **CORE-06**: User can write raw data to a file without serialization via writeRaw()
- [x] **CORE-07**: Format detection automatically selects the correct parser based on file extension
- [ ] **CORE-08**: User can stream large CSV/text files via a separate stream() method that returns a ReadableStream

### Binary Drivers

- [ ] **BIN-01**: User can read an XLSX file and receive parsed row data using a lite driver (~8KB)
- [ ] **BIN-02**: User can read a DOCX file and receive extracted text using a lite driver (~8KB)
- [ ] **BIN-03**: User can read an image file and receive a base64 string (server) or blob URL (browser)
- [ ] **BIN-04**: When lite driver cannot parse a complex file, user receives a helpful error suggesting a full-featured alternative

### Environment

- [x] **ENV-01**: Library auto-detects the runtime environment (Node, Bun, Deno, Browser)
- [ ] **ENV-02**: read() works in Node.js using native fs module
- [ ] **ENV-03**: read() works in Bun using Bun's fs compatibility
- [ ] **ENV-04**: read() works in Deno using Deno fs APIs
- [ ] **ENV-05**: read() works in Browser using fetch() for URL strings
- [ ] **ENV-06**: read() works in Browser accepting File/Blob objects from file inputs
- [ ] **ENV-07**: write() triggers a file download in browser environments

### Server

- [ ] **SRV-01**: Server-side writes use atomic temp-write → rename pattern to prevent corruption
- [x] **SRV-02**: All server-side path inputs are sanitized against directory traversal attacks

### Framework Adapters

- [ ] **FW-01**: React users can use useFile(path) hook that returns { data, loading, error }
- [ ] **FW-02**: Vue users can use useFileVue(path) composable that returns reactive refs
- [ ] **FW-03**: Svelte users can use fileStore(path) that returns a reactive store

### Build & Distribution

- [x] **BUILD-01**: Library ships as both ESM and CJS via dual output build
- [x] **BUILD-02**: Library ships with full TypeScript type definitions
- [x] **BUILD-03**: Framework adapters are tree-shakeable via separate entry points (omnifs/react, omnifs/vue, omnifs/svelte)
- [x] **BUILD-04**: Core bundle size (excluding framework adapters) is under 20KB gzipped

### Documentation

- [ ] **DOCS-01**: README includes installation, basic usage for all supported formats, and framework adapter examples
- [ ] **DOCS-02**: API reference documents all public methods, parameters, and return types

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Parsing

- **EXT-01**: User can read YAML files and receive parsed objects
- **EXT-02**: User can read TOML files and receive parsed objects
- **EXT-03**: Content-type sniffing beyond file extension (magic bytes)

### Performance

- **PERF-01**: Large XLSX files can be parsed in a Web Worker to avoid UI blocking
- **PERF-02**: Node.js worker threads for CPU-intensive parsing

### Extensibility

- **PLUG-01**: Plugin interface for registering custom format parsers

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full XLSX write (charts, formulas, styles) | Turns 8KB driver into 500KB+; suggest SheetJS for full Excel |
| PDF parsing | Requires heavy external library (pdf.js); different problem domain |
| File watching | Solved by chokidar/nodemon; not a file I/O concern |
| Cloud storage (S3, GCS) | Massive scope creep, auth complexity; users wrap their own SDKs |
| Image manipulation | Wrong abstraction layer; return raw data, users use sharp/canvas |
| Sync API (readSync) | Blocks event loop, doesn't work in browser, anti-pattern |
| Runtime plugin registry | Adds complexity, harder to tree-shake; fallback chain is simpler |
| React Native | Web and server runtimes only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENV-01 | Phase 1 | Complete |
| BUILD-01 | Phase 1 | Pending |
| BUILD-02 | Phase 1 | Pending |
| BUILD-03 | Phase 1 | Pending |
| BUILD-04 | Phase 1 | Pending |
| CORE-01 | Phase 2 | Complete |
| CORE-02 | Phase 2 | Complete |
| CORE-03 | Phase 2 | Complete |
| CORE-04 | Phase 2 | Complete |
| CORE-05 | Phase 2 | Pending |
| CORE-06 | Phase 2 | Pending |
| CORE-07 | Phase 2 | Complete |
| CORE-08 | Phase 2 | Pending |
| ENV-02 | Phase 2 | Pending |
| ENV-03 | Phase 2 | Pending |
| ENV-04 | Phase 2 | Pending |
| ENV-05 | Phase 2 | Pending |
| ENV-06 | Phase 2 | Pending |
| ENV-07 | Phase 2 | Pending |
| SRV-01 | Phase 2 | Pending |
| SRV-02 | Phase 2 | Complete |
| BIN-01 | Phase 3 | Pending |
| BIN-02 | Phase 3 | Pending |
| BIN-03 | Phase 3 | Pending |
| BIN-04 | Phase 3 | Pending |
| FW-01 | Phase 4 | Pending |
| FW-02 | Phase 4 | Pending |
| FW-03 | Phase 4 | Pending |
| DOCS-01 | Phase 4 | Pending |
| DOCS-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
