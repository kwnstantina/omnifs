# OmniFS: The Isomorphic File Engine

## What This Is

OmniFS is a zero-config, universal file system library for JavaScript that provides a single API for reading and writing files across Node.js, Bun, Deno, and the Browser. It auto-detects file types, environments, and serialization formats so app developers never think about file I/O plumbing again.

## Core Value

A single `read()` / `write()` call that just works — any file format, any JS runtime, any environment — with zero configuration.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Unified read/write API across Node.js, Bun, Deno, and Browser
- [ ] Smart parsing engine (JSON, CSV/TSV, XLSX, DOCX, Images, Text)
- [ ] Smart write with auto-serialization (object → JSON, array → CSV) plus raw escape hatch
- [ ] Lite-Zip drivers for XLSX/DOCX using fflate (~8KB) instead of heavy libs
- [ ] Fallback chain: lite parser fails → helpful error suggesting full plugin install
- [ ] Environment auto-detection (Node/Bun/Deno/Browser)
- [ ] Browser read from both URL (fetch) and File/Blob objects
- [ ] Browser write triggers download
- [ ] Atomic backend writes (temp-write → rename pattern)
- [ ] Streaming support for large files (CSV, text)
- [ ] Framework adapters: React (useFile), Vue (useFileVue), Svelte (fileStore)
- [ ] Tree-shakeable multi-entry build (omnifs/react, omnifs/vue, omnifs/svelte)
- [ ] Path sanitization to prevent directory traversal on backend
- [ ] TypeScript-first with full type definitions
- [ ] Polished README, API docs, and usage examples

### Out of Scope

- Full xlsx/docx parsing (complex charts, macros, formatting) — handled by suggesting external plugins
- Native mobile runtimes (React Native, etc.) — web and server runtimes only for v1
- File watching / live reload — out of scope for v1
- Authentication or cloud storage backends (S3, GCS) — pure local/URL I/O only

## Context

- Build tooling: tsup for dual ESM/CJS output, vitest for testing
- Key dependency: fflate for lightweight ZIP handling (~8KB)
- The library targets app developers who want file I/O to "just work" without environment-specific code
- Browser environment uses fetch() for URL paths and FileReader for File/Blob objects
- Smart write defaults to auto-serialization based on file extension, with writeRaw() as escape hatch
- Lite drivers handle the 80% case for XLSX/DOCX; complex files fail gracefully with actionable error messages

## Constraints

- **Bundle size**: Lite-Zip driver must stay under ~8KB — this is a key differentiator
- **Zero config**: No setup or configuration required for basic usage
- **Tree shaking**: Framework adapters must be separate entry points to avoid bundling unused code
- **Security**: All server-side path inputs must be sanitized against directory traversal

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| fflate for ZIP handling | ~8KB vs 1MB+ alternatives, sufficient for lite extraction | — Pending |
| tsup + vitest toolchain | Modern, fast, supports dual ESM/CJS output | — Pending |
| Smart write by default | Matches the "just works" philosophy; writeRaw() for escape hatch | — Pending |
| Fallback chain (no plugin registry) | Simpler than a formal plugin system; suggest install on failure | — Pending |
| All three framework adapters in v1 | Users expect framework support at launch | — Pending |
| Streaming in v1 | Large file support is expected for a serious file library | — Pending |

---
*Last updated: 2026-03-19 after initialization*
