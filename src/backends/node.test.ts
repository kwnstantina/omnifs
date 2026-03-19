import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OmniReadError } from "../errors.js";
import { nodeBackend } from "./node.js";

// Generate a unique temp directory for each test run
let testDir: string;

beforeEach(async () => {
	testDir = join(
		tmpdir(),
		`omnifs-node-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
	await rm(testDir, { recursive: true, force: true });
});

describe("nodeBackend.readBytes", () => {
	it("reads a file and returns Uint8Array", async () => {
		const filePath = join(testDir, "hello.txt");
		const { writeFile } = await import("node:fs/promises");
		await writeFile(filePath, "hello");

		const result = await nodeBackend.readBytes(filePath);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]); // "hello"
	});

	it("rejects traversal path with OmniReadError", async () => {
		await expect(nodeBackend.readBytes("../etc/passwd")).rejects.toThrow(
			OmniReadError,
		);
	});

	it("OmniReadError from traversal path contains path", async () => {
		let caught: unknown;
		try {
			await nodeBackend.readBytes("../etc/passwd");
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(OmniReadError);
		expect((caught as OmniReadError).path).toBe("../etc/passwd");
	});

	it("throws OmniReadError for non-existent file", async () => {
		const filePath = join(testDir, "nonexistent.txt");
		await expect(nodeBackend.readBytes(filePath)).rejects.toThrow(
			OmniReadError,
		);
	});

	it("OmniReadError from non-existent file contains path", async () => {
		const filePath = join(testDir, "nonexistent.txt");
		let caught: unknown;
		try {
			await nodeBackend.readBytes(filePath);
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(OmniReadError);
		expect((caught as OmniReadError).path).toBe(filePath);
	});
});

describe("nodeBackend.writeBytes", () => {
	it("writes Uint8Array to a file", async () => {
		const filePath = join(testDir, "output.txt");
		const data = new Uint8Array([119, 111, 114, 108, 100]); // "world"
		await nodeBackend.writeBytes(filePath, data);

		const { readFile } = await import("node:fs/promises");
		const contents = await readFile(filePath);
		expect(Array.from(new Uint8Array(contents))).toEqual([
			119, 111, 114, 108, 100,
		]);
	});

	it("creates parent directories if needed", async () => {
		const filePath = join(testDir, "nested", "deep", "output.txt");
		const data = new Uint8Array([65, 66, 67]); // "ABC"
		await nodeBackend.writeBytes(filePath, data);

		const { readFile } = await import("node:fs/promises");
		const contents = await readFile(filePath);
		expect(Array.from(new Uint8Array(contents))).toEqual([65, 66, 67]);
	});

	it("rejects traversal path with OmniReadError", async () => {
		await expect(
			nodeBackend.writeBytes("../evil.txt", new Uint8Array([1])),
		).rejects.toThrow(OmniReadError);
	});
});

describe("nodeBackend.writeAtomic", () => {
	it("writes data atomically (file contains the data after call)", async () => {
		const filePath = join(testDir, "atomic.txt");
		const data = new Uint8Array([104, 105]); // "hi"
		await nodeBackend.writeAtomic(filePath, data);

		const { readFile } = await import("node:fs/promises");
		const contents = await readFile(filePath);
		expect(Array.from(new Uint8Array(contents))).toEqual([104, 105]);
	});

	it("creates parent directories if needed", async () => {
		const filePath = join(testDir, "sub", "atomic.txt");
		const data = new Uint8Array([88]); // "X"
		await nodeBackend.writeAtomic(filePath, data);

		const { readFile } = await import("node:fs/promises");
		const contents = await readFile(filePath);
		expect(Array.from(new Uint8Array(contents))).toEqual([88]);
	});

	it("no .tmp file remains after successful write", async () => {
		const filePath = join(testDir, "atomic.txt");
		const data = new Uint8Array([1, 2, 3]);
		await nodeBackend.writeAtomic(filePath, data);

		const { stat } = await import("node:fs/promises");
		// tmpPath should not exist after successful rename
		await expect(stat(`${filePath}.omnifs.tmp`)).rejects.toThrow();
		// But target should exist
		await expect(stat(filePath)).resolves.toBeDefined();
	});

	it("rejects traversal path with OmniReadError", async () => {
		await expect(
			nodeBackend.writeAtomic("../evil.txt", new Uint8Array([1])),
		).rejects.toThrow(OmniReadError);
	});
});

describe("nodeBackend.readStream", () => {
	it("returns a ReadableStream of Uint8Array chunks", async () => {
		const filePath = join(testDir, "stream.txt");
		const { writeFile } = await import("node:fs/promises");
		await writeFile(filePath, "stream data");

		const stream = nodeBackend.readStream?.(filePath);
		expect(stream).toBeInstanceOf(ReadableStream);

		// Read all chunks and concatenate
		const reader = stream?.getReader();
		const chunks: Uint8Array[] = [];
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
		const combined = new Uint8Array(
			chunks.reduce((acc, c) => acc + c.length, 0),
		);
		let offset = 0;
		for (const chunk of chunks) {
			combined.set(chunk, offset);
			offset += chunk.length;
		}
		expect(new TextDecoder().decode(combined)).toBe("stream data");
	});

	it("rejects traversal path with OmniReadError when reading stream", () => {
		expect(() => {
			nodeBackend.readStream?.("../evil.txt");
		}).toThrow(OmniReadError);
	});
});
