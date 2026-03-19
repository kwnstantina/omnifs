// Extend globalThis to type Bun, Deno and process without importing runtime type packages
declare global {
	// biome-ignore lint/suspicious/noExplicitAny: intentional untyped global for runtime detection
	var Bun: any;
	// biome-ignore lint/suspicious/noExplicitAny: intentional untyped global for runtime detection
	var Deno: any;
	var process: { versions?: { node?: string } } | undefined;
}

/**
 * Supported runtime environments for OmniFS.
 */
export type RuntimeEnv = "node" | "bun" | "deno" | "browser" | "unknown";

/**
 * Detect the current JavaScript runtime environment.
 *
 * Priority order: Bun -> Deno -> Node -> Browser -> unknown
 *
 * The browser check requires both `window` AND `document` to be present,
 * preventing false positives in SSR environments (e.g. Next.js server-side
 * rendering) where `window` may be polyfilled but `document` is absent.
 */
export function detectEnv(): RuntimeEnv {
	if (typeof globalThis.Bun !== "undefined") {
		return "bun";
	}
	if (typeof globalThis.Deno !== "undefined") {
		return "deno";
	}
	if (process?.versions?.node) {
		return "node";
	}
	if (typeof window !== "undefined" && typeof document !== "undefined") {
		return "browser";
	}
	return "unknown";
}
