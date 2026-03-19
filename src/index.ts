export type { RuntimeEnv } from "./env.js";
export { detectEnv } from "./env.js";
export { OmniFormatError, OmniReadError, OmniWriteError } from "./errors.js";
export type { OmniResult, ReadOptions, WriteOptions } from "./types.js";

import {
	routedRead,
	routedStream,
	routedWrite,
	routedWriteRaw,
} from "./router.js";
import type { ReadOptions, WriteOptions } from "./types.js";

/**
 * Read a file and parse it automatically based on its format.
 *
 * @param source - Path, URL, or browser File/Blob
 * @param options - Optional format-specific options (e.g., delimiter for CSV)
 * @returns Parsed file contents — type depends on format
 */
export async function read<T = unknown>(
	source: string | Blob | File,
	options?: ReadOptions,
): Promise<T> {
	return routedRead<T>(source, options);
}

/**
 * Write data to a file, serializing it to the appropriate format.
 * On server runtimes, uses atomic writes (temp file + rename).
 * In the browser, triggers a file download.
 *
 * @param path - File path or filename
 * @param data - Data to serialize and write
 * @param options - Optional format-specific options
 */
export async function write(
	path: string,
	data: unknown,
	options?: WriteOptions,
): Promise<void> {
	return routedWrite(path, data, options);
}

/**
 * Write raw bytes or string to a file without serialization.
 *
 * @param path - File path or filename
 * @param data - Raw bytes or string to write
 */
export async function writeRaw(
	path: string,
	data: Uint8Array | string,
): Promise<void> {
	return routedWriteRaw(path, data);
}

/**
 * Stream a file as a ReadableStream of parsed records.
 * Supports CSV, TSV, and text formats.
 *
 * @param path - File path or URL
 * @param options - Optional format-specific options
 * @returns ReadableStream of parsed records
 */
export async function stream(
	path: string,
	options?: ReadOptions,
): Promise<ReadableStream> {
	return routedStream(path, options);
}
