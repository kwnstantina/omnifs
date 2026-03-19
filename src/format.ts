import type { FormatName } from "./parsers/types.js";

/**
 * Maps file extensions to FormatName values.
 */
const EXT_MAP: Record<string, FormatName> = {
	json: "json",
	csv: "csv",
	tsv: "tsv",
	tab: "tsv",
	txt: "text",
	md: "text",
	log: "text",
	text: "text",
	xml: "xml",
};

/**
 * Maps MIME types to FormatName values.
 * Used as an optional hint for browser Blob/File scenarios.
 */
const MIME_MAP: Record<string, FormatName> = {
	"application/json": "json",
	"text/json": "json",
	"text/csv": "csv",
	"text/tab-separated-values": "tsv",
	"text/plain": "text",
	"text/markdown": "text",
	"text/xml": "xml",
	"application/xml": "xml",
};

/**
 * Detect the format name from a file path or URL, with an optional MIME type hint.
 *
 * @param path - File path, relative path, absolute path, or full URL string.
 * @param mimeHint - Optional MIME type string (e.g. from Blob.type or Content-Type header).
 * @returns A FormatName if the format is recognized, or null for unknown formats.
 */
export function detectFormat(
	path: string,
	mimeHint?: string,
): FormatName | null {
	// Try MIME hint first — specific known types take priority
	if (mimeHint) {
		// Normalize by stripping parameters (e.g. "text/plain; charset=utf-8" -> "text/plain")
		const mimeBase = mimeHint.split(";")[0].trim().toLowerCase();
		const fromMime = MIME_MAP[mimeBase];
		if (fromMime) {
			return fromMime;
		}
	}

	// Extract the pathname for URL strings
	let pathname = path;
	if (path.startsWith("http://") || path.startsWith("https://")) {
		try {
			pathname = new URL(path).pathname;
		} catch {
			// If URL parsing fails, fall through to extension detection on raw path
		}
	}

	// Strip query string if present (for non-URL paths that somehow have one)
	const withoutQuery = pathname.split("?")[0];

	// Extract extension
	const lastDot = withoutQuery.lastIndexOf(".");
	if (lastDot === -1 || lastDot === withoutQuery.length - 1) {
		// No extension or trailing dot
		return null;
	}

	const ext = withoutQuery.slice(lastDot + 1).toLowerCase();
	return EXT_MAP[ext] ?? null;
}
