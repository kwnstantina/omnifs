import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectEnv } from "./env.js";

describe("detectEnv", () => {
	// Save original globals before each test
	let originalBun: unknown;
	let originalDeno: unknown;
	let originalWindow: unknown;
	let originalDocument: unknown;
	let originalProcessVersions: NodeJS.ProcessVersions | undefined;

	beforeEach(() => {
		originalBun = (globalThis as Record<string, unknown>).Bun;
		originalDeno = (globalThis as Record<string, unknown>).Deno;
		originalWindow = (globalThis as Record<string, unknown>).window;
		originalDocument = (globalThis as Record<string, unknown>).document;
		originalProcessVersions = process.versions;
	});

	afterEach(() => {
		// Restore globals
		if (originalBun === undefined) {
			delete (globalThis as Record<string, unknown>).Bun;
		} else {
			(globalThis as Record<string, unknown>).Bun = originalBun;
		}
		if (originalDeno === undefined) {
			delete (globalThis as Record<string, unknown>).Deno;
		} else {
			(globalThis as Record<string, unknown>).Deno = originalDeno;
		}
		if (originalWindow === undefined) {
			delete (globalThis as Record<string, unknown>).window;
		} else {
			(globalThis as Record<string, unknown>).window = originalWindow;
		}
		if (originalDocument === undefined) {
			delete (globalThis as Record<string, unknown>).document;
		} else {
			(globalThis as Record<string, unknown>).document = originalDocument;
		}
		// Restore process.versions (read-only, use Object.defineProperty)
		Object.defineProperty(process, "versions", {
			value: originalProcessVersions,
			writable: true,
			configurable: true,
		});
	});

	it("returns 'node' in default vitest environment", () => {
		// No mocking needed — vitest runs in Node.js
		// Ensure Bun and Deno are not set
		delete (globalThis as Record<string, unknown>).Bun;
		delete (globalThis as Record<string, unknown>).Deno;
		expect(detectEnv()).toBe("node");
	});

	it("returns 'bun' when Bun global exists", () => {
		(globalThis as Record<string, unknown>).Bun = {};
		expect(detectEnv()).toBe("bun");
	});

	it("returns 'deno' when Deno global exists", () => {
		delete (globalThis as Record<string, unknown>).Bun;
		(globalThis as Record<string, unknown>).Deno = { version: {} };
		expect(detectEnv()).toBe("deno");
	});

	it("returns 'bun' over 'deno' when both exist (priority test)", () => {
		(globalThis as Record<string, unknown>).Bun = {};
		(globalThis as Record<string, unknown>).Deno = { version: {} };
		expect(detectEnv()).toBe("bun");
	});

	it("returns 'browser' when window and document exist", () => {
		delete (globalThis as Record<string, unknown>).Bun;
		delete (globalThis as Record<string, unknown>).Deno;
		// Remove process.versions.node to avoid Node detection taking priority
		Object.defineProperty(process, "versions", {
			value: {},
			writable: true,
			configurable: true,
		});
		(globalThis as Record<string, unknown>).window = {};
		(globalThis as Record<string, unknown>).document = {};
		expect(detectEnv()).toBe("browser");
	});

	it("returns 'node' for SSR (window exists but no document)", () => {
		delete (globalThis as Record<string, unknown>).Bun;
		delete (globalThis as Record<string, unknown>).Deno;
		// process.versions.node is intact (Node environment)
		(globalThis as Record<string, unknown>).window = {};
		delete (globalThis as Record<string, unknown>).document;
		expect(detectEnv()).toBe("node");
	});
});
