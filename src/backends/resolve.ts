import { detectEnv } from "../env.js";
import type { IOBackend } from "./types.js";

/**
 * Resolve the correct I/O backend for the current runtime environment.
 * Uses dynamic imports to enable tree-shaking — browser bundles won't include node:fs code.
 */
export async function resolveBackend(): Promise<IOBackend> {
	const env = detectEnv();
	switch (env) {
		case "bun":
			return (await import("./bun.js")).bunBackend;
		case "deno":
			return (await import("./deno.js")).denoBackend;
		case "node":
			return (await import("./node.js")).nodeBackend;
		case "browser":
			return (await import("./browser.js")).browserBackend;
		default:
			throw new Error(`Unsupported runtime: ${env}`);
	}
}
