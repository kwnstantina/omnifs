// V8-specific stack trace capture (Node.js / Bun / Chromium)
type ErrorConstructorWithCapture = ErrorConstructor & {
	captureStackTrace?: (target: object, ctor: unknown) => void;
};

const ErrorCtor = Error as ErrorConstructorWithCapture;

/**
 * Error thrown when a file cannot be read.
 */
export class OmniReadError extends Error {
	override readonly name = "OmniReadError";

	constructor(
		message: string,
		public readonly path: string,
		public readonly format?: string,
		public readonly suggestion?: string,
	) {
		super(message);
		ErrorCtor.captureStackTrace?.(this, OmniReadError);
	}
}

/**
 * Error thrown when a file cannot be written.
 */
export class OmniWriteError extends Error {
	override readonly name = "OmniWriteError";

	constructor(
		message: string,
		public readonly path: string,
		public readonly format?: string,
		public readonly suggestion?: string,
	) {
		super(message);
		ErrorCtor.captureStackTrace?.(this, OmniWriteError);
	}
}

/**
 * Error thrown when a file format is unsupported or requires a heavier driver.
 */
export class OmniFormatError extends Error {
	override readonly name = "OmniFormatError";

	constructor(
		message: string,
		public readonly format: string,
		public readonly suggestion?: string,
	) {
		super(message);
		ErrorCtor.captureStackTrace?.(this, OmniFormatError);
	}
}
