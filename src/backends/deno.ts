import { OmniReadError, OmniWriteError } from "../errors.js";
import { sanitizePath } from "../sanitize.js";
import type { IOBackend } from "./types.js";

const dirname = (p: string) => p.replace(/[/\\][^/\\]*$/, "") || ".";

export const denoBackend: IOBackend = {
	async readBytes(path: string): Promise<Uint8Array> {
		sanitizePath(path);
		try {
			return await Deno.readFile(path);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to read file";
			throw new OmniReadError(msg, path);
		}
	},

	async writeBytes(path: string, data: Uint8Array): Promise<void> {
		sanitizePath(path);
		try {
			const dir = dirname(path);
			if (dir !== ".") {
				await Deno.mkdir(dir, { recursive: true });
			}
			await Deno.writeFile(path, data);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to write file";
			throw new OmniWriteError(msg, path);
		}
	},

	async writeAtomic(path: string, data: Uint8Array): Promise<void> {
		sanitizePath(path);
		const tmpPath = `${path}.omnifs.tmp`;
		try {
			const dir = dirname(path);
			if (dir !== ".") {
				await Deno.mkdir(dir, { recursive: true });
			}
			await Deno.writeFile(tmpPath, data);
			await Deno.rename(tmpPath, path);
		} catch (err) {
			try {
				await Deno.remove(tmpPath);
			} catch {
				// Ignore cleanup errors
			}
			const msg = err instanceof Error ? err.message : "Failed to write file";
			throw new OmniWriteError(msg, path);
		}
	},

	readStream(path: string): ReadableStream<Uint8Array> {
		sanitizePath(path);
		// Deno file handles provide a readable property
		// We create a lazy stream that opens the file when consumed
		return new ReadableStream<Uint8Array>({
			async start(controller) {
				try {
					const file = await Deno.open(path, { read: true });
					const reader = file.readable.getReader();
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							controller.close();
							break;
						}
						controller.enqueue(value);
					}
				} catch (err) {
					const msg =
						err instanceof Error ? err.message : "Failed to stream file";
					controller.error(new OmniReadError(msg, path));
				}
			},
		});
	},
};
