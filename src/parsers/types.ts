/**
 * The set of format names supported by the omnifs parser registry.
 * Used as keys to look up the correct parser/serializer at runtime.
 */
export type FormatName = "text" | "json" | "csv" | "tsv" | "xml";

/**
 * Interface for format parsers that convert raw bytes or strings into structured data.
 */
export interface Parser<T = unknown> {
	parse(data: Uint8Array | string, options?: Record<string, unknown>): T;
}

/**
 * Interface for format serializers that convert structured data to bytes or strings.
 */
export interface Serializer<T = unknown> {
	serialize(data: T, options?: Record<string, unknown>): string | Uint8Array;
}
