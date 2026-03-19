import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OmniReadError } from "../errors.js";
import { browserBackend } from "./browser.js";

// Mock fetch and document globals for browser simulation in Node test env

describe("browserBackend", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("readBytes (URL string via fetch)", () => {
		it("fetches URL and returns Uint8Array on success", async () => {
			const mockData = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
			const arrayBuffer = mockData.buffer as ArrayBuffer;

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: "OK",
				arrayBuffer: () => Promise.resolve(arrayBuffer),
				body: null,
			});
			vi.stubGlobal("fetch", mockFetch);

			const result = await browserBackend.readBytes(
				"https://example.com/data.json",
			);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
			expect(mockFetch).toHaveBeenCalledWith("https://example.com/data.json");
		});

		it("throws OmniReadError when fetch returns 404", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
				arrayBuffer: () => Promise.reject(new Error("should not call")),
				body: null,
			});
			vi.stubGlobal("fetch", mockFetch);

			await expect(
				browserBackend.readBytes("https://example.com/missing.json"),
			).rejects.toThrow(OmniReadError);
		});

		it("OmniReadError from 404 contains the path", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
				arrayBuffer: () => Promise.reject(new Error("should not call")),
				body: null,
			});
			vi.stubGlobal("fetch", mockFetch);

			let caught: unknown;
			try {
				await browserBackend.readBytes("https://example.com/missing.json");
			} catch (e) {
				caught = e;
			}
			expect(caught).toBeInstanceOf(OmniReadError);
			expect((caught as OmniReadError).path).toBe(
				"https://example.com/missing.json",
			);
		});

		it("OmniReadError message includes status code", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 403,
				statusText: "Forbidden",
				arrayBuffer: () => Promise.reject(new Error("should not call")),
				body: null,
			});
			vi.stubGlobal("fetch", mockFetch);

			let caught: unknown;
			try {
				await browserBackend.readBytes("https://example.com/secret.json");
			} catch (e) {
				caught = e;
			}
			expect((caught as OmniReadError).message).toContain("403");
		});

		it("throws OmniReadError on network error", async () => {
			const mockFetch = vi
				.fn()
				.mockRejectedValue(new TypeError("Failed to fetch"));
			vi.stubGlobal("fetch", mockFetch);

			await expect(
				browserBackend.readBytes("https://example.com/data.json"),
			).rejects.toThrow(OmniReadError);
		});

		it("OmniReadError from network error contains the path", async () => {
			const mockFetch = vi
				.fn()
				.mockRejectedValue(new TypeError("Failed to fetch"));
			vi.stubGlobal("fetch", mockFetch);

			let caught: unknown;
			try {
				await browserBackend.readBytes("https://example.com/data.json");
			} catch (e) {
				caught = e;
			}
			expect(caught).toBeInstanceOf(OmniReadError);
			expect((caught as OmniReadError).path).toBe(
				"https://example.com/data.json",
			);
		});
	});

	describe("writeBytes (download trigger)", () => {
		let mockAnchor: {
			href: string;
			download: string;
			click: ReturnType<typeof vi.fn>;
		};
		let mockDocument: {
			createElement: ReturnType<typeof vi.fn>;
			body: {
				appendChild: ReturnType<typeof vi.fn>;
				removeChild: ReturnType<typeof vi.fn>;
			};
		};
		let mockURL: {
			createObjectURL: ReturnType<typeof vi.fn>;
			revokeObjectURL: ReturnType<typeof vi.fn>;
		};

		beforeEach(() => {
			mockAnchor = {
				href: "",
				download: "",
				click: vi.fn(),
			};
			mockDocument = {
				createElement: vi.fn().mockReturnValue(mockAnchor),
				body: {
					appendChild: vi.fn(),
					removeChild: vi.fn(),
				},
			};
			mockURL = {
				createObjectURL: vi
					.fn()
					.mockReturnValue("blob:http://localhost/fake-uuid"),
				revokeObjectURL: vi.fn(),
			};
			vi.stubGlobal("document", mockDocument);
			vi.stubGlobal("URL", mockURL);
			// Blob is available in modern Node.js but stub for safety
			vi.stubGlobal("Blob", globalThis.Blob ?? class Blob {});
		});

		it("creates an anchor element and triggers click", async () => {
			const data = new Uint8Array([1, 2, 3]);
			await browserBackend.writeBytes("output.csv", data);

			expect(mockDocument.createElement).toHaveBeenCalledWith("a");
			expect(mockAnchor.click).toHaveBeenCalled();
		});

		it("sets href to the blob object URL", async () => {
			const data = new Uint8Array([1, 2, 3]);
			await browserBackend.writeBytes("output.csv", data);

			expect(mockAnchor.href).toBe("blob:http://localhost/fake-uuid");
		});

		it("sets download attribute to the filename (path)", async () => {
			const data = new Uint8Array([1, 2, 3]);
			await browserBackend.writeBytes("mydata.json", data);

			expect(mockAnchor.download).toBe("mydata.json");
		});

		it("revokes the object URL after triggering download", async () => {
			const data = new Uint8Array([1, 2, 3]);
			await browserBackend.writeBytes("output.csv", data);

			expect(mockURL.revokeObjectURL).toHaveBeenCalledWith(
				"blob:http://localhost/fake-uuid",
			);
		});

		it("appends anchor to body before click and removes it after", async () => {
			const data = new Uint8Array([1, 2, 3]);
			await browserBackend.writeBytes("output.csv", data);

			expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockAnchor);
			expect(mockDocument.body.removeChild).toHaveBeenCalledWith(mockAnchor);
		});
	});

	describe("writeAtomic (delegates to writeBytes)", () => {
		it("triggers the same download as writeBytes", async () => {
			const mockAnchor = { href: "", download: "", click: vi.fn() };
			const mockDoc = {
				createElement: vi.fn().mockReturnValue(mockAnchor),
				body: { appendChild: vi.fn(), removeChild: vi.fn() },
			};
			const mockURL = {
				createObjectURL: vi.fn().mockReturnValue("blob:fake"),
				revokeObjectURL: vi.fn(),
			};
			vi.stubGlobal("document", mockDoc);
			vi.stubGlobal("URL", mockURL);
			vi.stubGlobal("Blob", globalThis.Blob ?? class Blob {});

			const data = new Uint8Array([9, 8, 7]);
			await browserBackend.writeAtomic("atomic.json", data);

			expect(mockDoc.createElement).toHaveBeenCalledWith("a");
			expect(mockAnchor.click).toHaveBeenCalled();
			expect(mockAnchor.download).toBe("atomic.json");
		});
	});

	describe("readStream (streaming via fetch response.body)", () => {
		it("returns a ReadableStream that pipes through the response body", async () => {
			// The stream should be a ReadableStream (wrapping the fetch response body)
			const fakeStream = new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(new Uint8Array([1, 2, 3]));
					controller.close();
				},
			});
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: "OK",
				arrayBuffer: () => Promise.reject(new Error("should not call")),
				body: fakeStream,
			});
			vi.stubGlobal("fetch", mockFetch);

			const stream = browserBackend.readStream?.(
				"https://example.com/large.csv",
			);
			expect(stream).toBeInstanceOf(ReadableStream);

			// Read data from the stream to verify it was piped correctly
			const reader = stream?.getReader();
			const { value } = await reader.read();
			expect(Array.from(value!)).toEqual([1, 2, 3]);
		});

		it("yields OmniReadError when fetch is not ok for readStream", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				body: null,
			});
			vi.stubGlobal("fetch", mockFetch);

			await expect(async () => {
				const stream = browserBackend.readStream?.(
					"https://example.com/large.csv",
				);
				// readStream returns a ReadableStream — errors surface when reading
				if (stream) {
					const reader = stream.getReader();
					await reader.read();
				}
			}).rejects.toThrow(OmniReadError);
		});

		it("yields OmniReadError when response has no body", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: "OK",
				body: null,
			});
			vi.stubGlobal("fetch", mockFetch);

			// readStream returns a ReadableStream — null body errors surface when reading
			await expect(async () => {
				const stream = browserBackend.readStream?.(
					"https://example.com/large.csv",
				);
				if (stream) {
					const reader = stream.getReader();
					await reader.read();
				}
			}).rejects.toThrow(OmniReadError);
		});
	});
});
