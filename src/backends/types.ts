/**
 * Interface for I/O backends that provide raw byte-level file access.
 * Different backends implement this for Node.js, Bun, Deno, and browser environments.
 */
export interface IOBackend {
	/** Read the full contents of a file as raw bytes. */
	readBytes(path: string): Promise<Uint8Array>;
	/** Write raw bytes to a file, overwriting any existing content. */
	writeBytes(path: string, data: Uint8Array): Promise<void>;
	/** Write raw bytes atomically (write to temp file then rename). */
	writeAtomic(path: string, data: Uint8Array): Promise<void>;
	/** Stream file contents as chunks of raw bytes (optional — not all backends support streaming). */
	readStream?(path: string): ReadableStream<Uint8Array>;
}
