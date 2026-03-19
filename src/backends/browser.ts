import { OmniReadError } from "../errors.js";
import type { IOBackend } from "./types.js";

/**
 * Browser I/O backend.
 *
 * - readBytes: fetches a URL via fetch() and returns the response as Uint8Array
 * - writeBytes: triggers a file download using a temporary anchor element
 * - writeAtomic: delegates to writeBytes (no atomic semantics in browser)
 * - readStream: returns a ReadableStream by piping through the fetch Response.body
 */
export const browserBackend: IOBackend = {
	async readBytes(path: string): Promise<Uint8Array> {
		let response: Response;
		try {
			response = await fetch(path);
		} catch (err) {
			throw new OmniReadError(
				`Network error: ${err instanceof Error ? err.message : String(err)}`,
				path,
			);
		}

		if (!response.ok) {
			throw new OmniReadError(
				`Fetch failed: ${response.status} ${response.statusText}`,
				path,
			);
		}

		const arrayBuffer = await response.arrayBuffer();
		return new Uint8Array(arrayBuffer);
	},

	async writeBytes(path: string, data: Uint8Array): Promise<void> {
		const blob = new Blob([data]);
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = path;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	},

	async writeAtomic(path: string, data: Uint8Array): Promise<void> {
		return browserBackend.writeBytes(path, data);
	},

	readStream(path: string): ReadableStream<Uint8Array> {
		// Synchronously kick off a fetch and pipe the response body into a new ReadableStream.
		// If the response is not ok or has no body, the stream will error.
		let controller!: ReadableStreamDefaultController<Uint8Array>;

		const stream = new ReadableStream<Uint8Array>({
			start(ctrl) {
				controller = ctrl;
			},
		});

		// Initiate the fetch — errors/non-ok responses will error the stream
		Promise.resolve(fetch(path))
			.then((response) => {
				if (!response.ok) {
					controller.error(
						new OmniReadError(
							`Fetch failed: ${response.status} ${response.statusText}`,
							path,
						),
					);
					return;
				}
				if (!response.body) {
					controller.error(
						new OmniReadError("Response has no body stream", path),
					);
					return;
				}
				// Pipe all chunks from the response body into our stream
				const reader = response.body.getReader();
				function pump(): void {
					reader
						.read()
						.then(({ done, value }) => {
							if (done) {
								controller.close();
							} else {
								controller.enqueue(value);
								pump();
							}
						})
						.catch((err: unknown) => {
							controller.error(err);
						});
				}
				pump();
			})
			.catch((err: unknown) => {
				controller.error(
					new OmniReadError(
						`Network error: ${err instanceof Error ? err.message : String(err)}`,
						path,
					),
				);
			});

		return stream;
	},
};
