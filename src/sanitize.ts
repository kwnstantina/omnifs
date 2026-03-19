import { OmniReadError } from "./errors.js";

/**
 * Sanitize a file path, rejecting empty strings and directory traversal attacks.
 *
 * - Empty strings throw OmniReadError with "empty" in the message.
 * - URL strings (http:// or https://) pass through unchanged — no fs traversal risk.
 * - Paths containing `..` segments (forward or backslash variants) throw OmniReadError.
 * - All other paths are returned unchanged (original form preserved for the caller).
 *
 * @param path - The path to sanitize.
 * @returns The original path if safe.
 * @throws OmniReadError if the path is empty or contains directory traversal.
 */
export function sanitizePath(path: string): string {
	// Reject empty strings
	if (path.length === 0) {
		throw new OmniReadError("Path cannot be empty", path);
	}

	// URLs pass through — no filesystem traversal risk
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}

	// Normalize backslashes to forward slashes for cross-platform traversal detection
	const normalized = path.replace(/\\/g, "/");

	// Check for .. segments anywhere in the path
	const segments = normalized.split("/");
	if (segments.includes("..")) {
		throw new OmniReadError(
			"Path rejected: directory traversal detected",
			path,
		);
	}

	return path;
}
