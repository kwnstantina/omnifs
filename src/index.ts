export type { RuntimeEnv } from "./env.js";
export { detectEnv } from "./env.js";
export { OmniFormatError, OmniReadError, OmniWriteError } from "./errors.js";
export type { OmniResult, ReadOptions, WriteOptions } from "./types.js";

import { OmniReadError, OmniWriteError } from "./errors.js";
import type { ReadOptions, WriteOptions } from "./types.js";

/**
 * Read a file and parse it automatically based on its format.
 *
 * @param path - Path or URL to the file
 * @param options - Optional format-specific options
 * @returns Parsed file contents
 */
export async function read<T = unknown>(
	path: string,
	_options?: ReadOptions,
): Promise<T> {
	throw new OmniReadError("Not implemented", path);
}

/**
 * Write data to a file, serializing it to the appropriate format.
 *
 * @param path - Path or URL to the file
 * @param data - Data to write
 * @param options - Optional format-specific options
 */
export async function write(
	path: string,
	_data: unknown,
	_options?: WriteOptions,
): Promise<void> {
	throw new OmniWriteError("Not implemented", path);
}

/**
 * Stream a file as a ReadableStream, parsing records incrementally.
 *
 * @param path - Path or URL to the file
 * @param options - Optional format-specific options
 * @returns A ReadableStream of parsed records
 */
export async function stream(
	path: string,
	_options?: ReadOptions,
): Promise<ReadableStream> {
	throw new OmniReadError("Not implemented", path);
}
