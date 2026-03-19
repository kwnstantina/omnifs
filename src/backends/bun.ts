import { OmniReadError, OmniWriteError } from "../errors.js";
import { sanitizePath } from "../sanitize.js";
import type { IOBackend } from "./types.js";

const _dirname = (p: string) => p.replace(/[/\\][^/\\]*$/, "") || ".";

export const bunBackend: IOBackend = {
	async readBytes(path: string): Promise<Uint8Array> {
		sanitizePath(path);
		try {
			const file = Bun.file(path);
			const buffer = await file.arrayBuffer();
			return new Uint8Array(buffer);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to read file";
			throw new OmniReadError(msg, path);
		}
	},

	async writeBytes(path: string, data: Uint8Array): Promise<void> {
		sanitizePath(path);
		try {
			await Bun.write(path, data);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to write file";
			throw new OmniWriteError(msg, path);
		}
	},

	async writeAtomic(path: string, data: Uint8Array): Promise<void> {
		sanitizePath(path);
		const tmpPath = `${path}.omnifs.tmp`;
		try {
			await Bun.write(tmpPath, data);
			// Bun supports node:fs for rename
			const fs = await import("node:fs/promises");
			await fs.rename(tmpPath, path);
		} catch (err) {
			try {
				const fs = await import("node:fs/promises");
				await fs.unlink(tmpPath);
			} catch {
				// Ignore cleanup errors
			}
			const msg = err instanceof Error ? err.message : "Failed to write file";
			throw new OmniWriteError(msg, path);
		}
	},

	readStream(path: string): ReadableStream<Uint8Array> {
		sanitizePath(path);
		return Bun.file(path).stream();
	},
};
