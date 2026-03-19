/**
 * Options for reading files.
 */
export interface ReadOptions {
	/** Field delimiter for delimited formats like CSV */
	delimiter?: string;
	/** Text encoding for reading files */
	encoding?: string;
	/** Additional format-specific options */
	[key: string]: unknown;
}

/**
 * Options for writing files.
 */
export interface WriteOptions {
	/** Whether to pretty-print structured formats like JSON or XML */
	pretty?: boolean;
	/** Field delimiter for delimited formats like CSV */
	delimiter?: string;
	/** Additional format-specific options */
	[key: string]: unknown;
}

/**
 * Generic result container for read operations.
 * The runtime auto-detects the format; T is a hint for the caller's type system.
 */
export type OmniResult<T = unknown> = T;
