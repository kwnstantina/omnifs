import { resolveBackend } from "./backends/resolve.js";
import { detectEnv } from "./env.js";
import { OmniFormatError, OmniReadError } from "./errors.js";
import { detectFormat } from "./format.js";
import { getParser, getSerializer } from "./parsers/registry.js";
import type { ReadOptions, WriteOptions } from "./types.js";

/**
 * Read and parse a file from a path, URL, or browser File/Blob.
 *
 * - String paths: resolved via backend + format detection
 * - Blob/File objects: read bytes directly, detect format from File.name or MIME type
 */
export async function routedRead<T = unknown>(
	source: string | Blob | File,
	options?: ReadOptions,
): Promise<T> {
	// Blob/File path — no backend needed, read bytes directly
	if (typeof source !== "string" && source instanceof Blob) {
		const format = detectBlobFormat(source);
		const bytes = new Uint8Array(await source.arrayBuffer());
		const parser = getParser(format);
		return parser.parse(bytes, options) as T;
	}

	// String path — use backend
	const format = detectFormat(source);
	if (!format) {
		throw new OmniFormatError(
			`Unsupported file format: ${source}`,
			"unknown",
			"Check the file extension or use a supported format (json, csv, tsv, txt)",
		);
	}

	const backend = await resolveBackend();
	const bytes = await backend.readBytes(source);
	const parser = getParser(format);
	return parser.parse(bytes, options) as T;
}

/**
 * Serialize data and write to a file.
 * Server runtimes use atomic writes; browser triggers a download.
 */
export async function routedWrite(
	path: string,
	data: unknown,
	options?: WriteOptions,
): Promise<void> {
	const format = detectFormat(path);
	if (!format) {
		throw new OmniFormatError(
			`Unsupported file format for write: ${path}`,
			"unknown",
			"Check the file extension or use a supported format (json, csv, tsv, txt)",
		);
	}

	const serializer = getSerializer(format);
	const output = serializer.serialize(data, options);
	const bytes =
		typeof output === "string" ? new TextEncoder().encode(output) : output;

	const backend = await resolveBackend();
	const env = detectEnv();
	const isServer = env === "node" || env === "bun" || env === "deno";

	if (isServer) {
		await backend.writeAtomic(path, bytes);
	} else {
		await backend.writeBytes(path, bytes);
	}
}

/**
 * Write raw bytes or string to a file without serialization.
 */
export async function routedWriteRaw(
	path: string,
	data: Uint8Array | string,
): Promise<void> {
	const bytes =
		typeof data === "string" ? new TextEncoder().encode(data) : data;

	const backend = await resolveBackend();
	const env = detectEnv();
	const isServer = env === "node" || env === "bun" || env === "deno";

	if (isServer) {
		await backend.writeAtomic(path, bytes);
	} else {
		await backend.writeBytes(path, bytes);
	}
}

const STREAMABLE_FORMATS = new Set(["csv", "tsv", "text"]);

/**
 * Stream a file as a ReadableStream of parsed records.
 * Only CSV, TSV, and text formats support streaming.
 */
export async function routedStream(
	path: string,
	options?: ReadOptions,
): Promise<ReadableStream> {
	const format = detectFormat(path);
	if (!format) {
		throw new OmniFormatError(
			`Unsupported file format for streaming: ${path}`,
			"unknown",
		);
	}

	if (!STREAMABLE_FORMATS.has(format)) {
		throw new OmniFormatError(
			`Format '${format}' does not support streaming. Only csv, tsv, and text can be streamed.`,
			format,
		);
	}

	const backend = await resolveBackend();
	if (!backend.readStream) {
		throw new OmniReadError("Streaming not supported in this runtime", path);
	}

	const rawStream = backend.readStream(path);
	const delimiter =
		format === "tsv" ? "\t" : ((options?.delimiter as string) ?? ",");

	if (format === "text") {
		return createLineSplitStream(rawStream);
	}

	// CSV/TSV: split into lines and parse each row
	return createCsvStream(rawStream, delimiter);
}

/**
 * Detect format from a Blob or File object.
 */
function detectBlobFormat(source: Blob) {
	// File objects have a .name property
	if ("name" in source && typeof (source as File).name === "string") {
		const format = detectFormat((source as File).name);
		if (format) return format;
	}

	// Try MIME type
	if (source.type) {
		const format = detectFormat("", source.type);
		if (format) return format;
	}

	throw new OmniFormatError(
		"Cannot detect format from Blob without filename or MIME type",
		"unknown",
		"Provide a File with a name, or a Blob with a MIME type",
	);
}

/**
 * Create a ReadableStream that splits raw byte chunks into text lines.
 */
function createLineSplitStream(
	rawStream: ReadableStream<Uint8Array>,
): ReadableStream<string> {
	const decoder = new TextDecoder();
	let buffer = "";

	return new ReadableStream<string>({
		async start(controller) {
			const reader = rawStream.getReader();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						// Flush remaining buffer
						if (buffer.length > 0) {
							controller.enqueue(buffer);
						}
						controller.close();
						break;
					}
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";
					for (const line of lines) {
						controller.enqueue(line);
					}
				}
			} catch (err) {
				controller.error(err);
			}
		},
	});
}

/**
 * Create a ReadableStream that splits raw byte chunks into parsed CSV/TSV rows.
 */
function createCsvStream(
	rawStream: ReadableStream<Uint8Array>,
	delimiter: string,
): ReadableStream<string[]> {
	const decoder = new TextDecoder();
	let buffer = "";

	return new ReadableStream<string[]>({
		async start(controller) {
			const reader = rawStream.getReader();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						// Parse remaining buffer
						if (buffer.trim().length > 0) {
							const cells = parseCsvLine(buffer.trim(), delimiter);
							controller.enqueue(cells);
						}
						controller.close();
						break;
					}
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";
					for (const line of lines) {
						if (line.trim().length > 0) {
							const cells = parseCsvLine(line.trim(), delimiter);
							controller.enqueue(cells);
						}
					}
				}
			} catch (err) {
				controller.error(err);
			}
		},
	});
}

/**
 * Simple CSV line parser — handles basic quoting.
 */
function parseCsvLine(line: string, delimiter: string): string[] {
	const cells: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === delimiter) {
			cells.push(current);
			current = "";
		} else {
			current += ch;
		}
	}
	cells.push(current);
	return cells;
}
