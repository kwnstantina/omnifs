import { beforeEach, describe, expect, it, vi } from "vitest";
import { OmniFormatError, OmniReadError } from "./errors.js";

// Mock the backend resolver to avoid actual filesystem operations
vi.mock("./backends/resolve.js", () => {
	const storage = new Map<string, Uint8Array>();
	const mockBackend = {
		readBytes: vi.fn(async (path: string) => {
			const data = storage.get(path);
			if (!data) throw new OmniReadError("File not found", path);
			return data;
		}),
		writeBytes: vi.fn(async (path: string, data: Uint8Array) => {
			storage.set(path, data);
		}),
		writeAtomic: vi.fn(async (path: string, data: Uint8Array) => {
			storage.set(path, data);
		}),
		readStream: vi.fn((path: string) => {
			const data = storage.get(path);
			if (!data) throw new OmniReadError("File not found", path);
			return new ReadableStream({
				start(controller) {
					controller.enqueue(data);
					controller.close();
				},
			});
		}),
	};
	return {
		resolveBackend: vi.fn(async () => mockBackend),
		_mockBackend: mockBackend,
		_storage: storage,
	};
});

import {
	routedRead,
	routedStream,
	routedWrite,
	routedWriteRaw,
} from "./router.js";

// Access the mock storage for setting up test data
const { _storage: storage, _mockBackend: mockBackend } = (await import(
	"./backends/resolve.js"
)) as {
	_storage: Map<string, Uint8Array>;
	_mockBackend: Record<string, ReturnType<typeof vi.fn>>;
};

beforeEach(() => {
	storage.clear();
	vi.clearAllMocks();
});

describe("routedRead — string paths", () => {
	it("reads and parses a JSON file", async () => {
		storage.set("data.json", new TextEncoder().encode('{"name":"test"}'));
		const result = await routedRead<{ name: string }>("data.json");
		expect(result).toEqual({ name: "test" });
	});

	it("reads and parses a CSV file", async () => {
		storage.set("data.csv", new TextEncoder().encode("a,b\n1,2\n3,4"));
		const result = await routedRead<string[][]>("data.csv");
		expect(result).toEqual([
			["a", "b"],
			["1", "2"],
			["3", "4"],
		]);
	});

	it("reads and parses a text file", async () => {
		storage.set("readme.txt", new TextEncoder().encode("hello world"));
		const result = await routedRead<string>("readme.txt");
		expect(result).toBe("hello world");
	});

	it("reads and parses a TSV file", async () => {
		storage.set("data.tsv", new TextEncoder().encode("a\tb\n1\t2"));
		const result = await routedRead<string[][]>("data.tsv");
		expect(result).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("throws OmniFormatError for unknown extension", async () => {
		await expect(routedRead("file.xyz")).rejects.toThrow(OmniFormatError);
	});

	it("passes options to parser", async () => {
		storage.set("data.csv", new TextEncoder().encode("a;b\n1;2"));
		const result = await routedRead<string[][]>("data.csv", { delimiter: ";" });
		expect(result).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});
});

describe("routedRead — Blob/File", () => {
	it("reads a File object using its name for format detection", async () => {
		const file = new File(['{"key":"value"}'], "data.json", {
			type: "application/json",
		});
		const result = await routedRead<{ key: string }>(file);
		expect(result).toEqual({ key: "value" });
	});

	it("reads a File with CSV content", async () => {
		const file = new File(["a,b\n1,2"], "data.csv", { type: "text/csv" });
		const result = await routedRead<string[][]>(file);
		expect(result).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("reads a Blob using MIME type for format detection", async () => {
		const blob = new Blob(['{"a":1}'], { type: "application/json" });
		const result = await routedRead<{ a: number }>(blob);
		expect(result).toEqual({ a: 1 });
	});

	it("throws OmniFormatError for Blob without name or MIME type", async () => {
		const blob = new Blob(["data"]);
		await expect(routedRead(blob)).rejects.toThrow(OmniFormatError);
	});
});

describe("routedWrite", () => {
	it("writes JSON with auto-serialization", async () => {
		await routedWrite("out.json", { a: 1 });
		const written = storage.get("out.json");
		expect(written).toBeDefined();
		expect(JSON.parse(new TextDecoder().decode(written!))).toEqual({ a: 1 });
	});

	it("writes CSV with auto-serialization", async () => {
		await routedWrite("out.csv", [
			["a", "b"],
			["1", "2"],
		]);
		const written = new TextDecoder().decode(storage.get("out.csv")!);
		expect(written).toContain("a,b");
		expect(written).toContain("1,2");
	});

	it("writes TSV with tab separators (not commas)", async () => {
		await routedWrite("out.tsv", [
			["x", "y"],
			["3", "4"],
		]);
		const written = new TextDecoder().decode(storage.get("out.tsv")!);
		expect(written).toContain("x\ty");
		expect(written).toContain("3\t4");
		expect(written).not.toContain("x,y");
	});

	it("throws OmniFormatError for unknown extension", async () => {
		await expect(routedWrite("file.xyz", "data")).rejects.toThrow(
			OmniFormatError,
		);
	});
});

describe("routedWriteRaw", () => {
	it("writes raw bytes without serialization", async () => {
		const data = new Uint8Array([1, 2, 3, 4]);
		await routedWriteRaw("file.bin", data);
		expect(storage.get("file.bin")).toEqual(data);
	});

	it("writes raw string as bytes", async () => {
		await routedWriteRaw("file.txt", "raw text");
		const written = new TextDecoder().decode(storage.get("file.txt")!);
		expect(written).toBe("raw text");
	});
});

describe("routedStream", () => {
	it("streams a CSV file as parsed rows", async () => {
		storage.set("large.csv", new TextEncoder().encode("a,b\n1,2\n3,4\n"));
		const stream = await routedStream("large.csv");
		const reader = stream.getReader();
		const rows: unknown[] = [];
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			rows.push(value);
		}
		expect(rows.length).toBeGreaterThanOrEqual(2);
	});

	it("streams a text file as lines", async () => {
		storage.set("log.txt", new TextEncoder().encode("line1\nline2\nline3\n"));
		const stream = await routedStream("log.txt");
		const reader = stream.getReader();
		const lines: string[] = [];
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			lines.push(value as string);
		}
		expect(lines).toContain("line1");
		expect(lines).toContain("line2");
		expect(lines).toContain("line3");
	});

	it("throws OmniFormatError for non-streamable format (JSON)", async () => {
		await expect(routedStream("data.json")).rejects.toThrow(OmniFormatError);
	});

	it("throws OmniFormatError for unknown format", async () => {
		await expect(routedStream("file.xyz")).rejects.toThrow(OmniFormatError);
	});
});
