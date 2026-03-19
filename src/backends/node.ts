import { OmniReadError, OmniWriteError } from "../errors.js";
import { sanitizePath } from "../sanitize.js";
import type { IOBackend } from "./types.js";

// Cache dynamic imports to avoid repeated async overhead
let fsPromises: typeof import("node:fs/promises") | null = null;
let fsSync: typeof import("node:fs") | null = null;
let nodePath: typeof import("node:path") | null = null;

async function getFs() {
	if (!fsPromises) {
		fsPromises = await import("node:fs/promises");
	}
	return fsPromises;
}

async function getFsSync() {
	if (!fsSync) {
		fsSync = await import("node:fs");
	}
	return fsSync;
}

async function getPath() {
	if (!nodePath) {
		nodePath = await import("node:path");
	}
	return nodePath;
}

export const nodeBackend: IOBackend = {
	async readBytes(path: string): Promise<Uint8Array> {
		sanitizePath(path);
		const fs = await getFs();
		try {
			const buffer = await fs.readFile(path);
			return new Uint8Array(buffer);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to read file";
			throw new OmniReadError(msg, path);
		}
	},

	async writeBytes(path: string, data: Uint8Array): Promise<void> {
		sanitizePath(path);
		const fs = await getFs();
		const p = await getPath();
		const dir = p.dirname(path);
		if (dir && dir !== ".") {
			await fs.mkdir(dir, { recursive: true });
		}
		try {
			await fs.writeFile(path, data);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to write file";
			throw new OmniWriteError(msg, path);
		}
	},

	async writeAtomic(path: string, data: Uint8Array): Promise<void> {
		sanitizePath(path);
		const fs = await getFs();
		const p = await getPath();
		const dir = p.dirname(path);
		const tmpPath = `${path}.omnifs.tmp`;
		if (dir && dir !== ".") {
			await fs.mkdir(dir, { recursive: true });
		}
		try {
			await fs.writeFile(tmpPath, data);
			await fs.rename(tmpPath, path);
		} catch (err) {
			// Clean up temp file on error
			try {
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
		// We need synchronous return, so we use a ReadableStream that
		// lazily pulls from the Node stream when read
		return new ReadableStream<Uint8Array>({
			async start(controller) {
				try {
					const fs = await getFsSync();
					const nodeStream = fs.createReadStream(path);
					nodeStream.on("data", (chunk: Buffer) => {
						controller.enqueue(new Uint8Array(chunk));
					});
					nodeStream.on("end", () => {
						controller.close();
					});
					nodeStream.on("error", (err) => {
						controller.error(new OmniReadError(err.message, path));
					});
				} catch (err) {
					const msg =
						err instanceof Error ? err.message : "Failed to create stream";
					controller.error(new OmniReadError(msg, path));
				}
			},
		});
	},
};
