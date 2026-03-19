import { describe, expect, it } from "vitest";
import { OmniReadError } from "./errors.js";
import { sanitizePath } from "./sanitize.js";

describe("sanitizePath", () => {
	describe("safe paths (pass-through)", () => {
		it("returns simple filename unchanged", () => {
			expect(sanitizePath("data.json")).toBe("data.json");
		});

		it("returns relative path unchanged", () => {
			expect(sanitizePath("./data/file.csv")).toBe("./data/file.csv");
		});

		it("returns absolute path unchanged", () => {
			expect(sanitizePath("/absolute/path.json")).toBe("/absolute/path.json");
		});

		it("returns nested relative path unchanged", () => {
			expect(sanitizePath("data/subdir/file.txt")).toBe("data/subdir/file.txt");
		});
	});

	describe("URL paths (pass-through)", () => {
		it("returns http URL unchanged", () => {
			expect(sanitizePath("http://example.com/data.csv")).toBe(
				"http://example.com/data.csv",
			);
		});

		it("returns https URL unchanged", () => {
			expect(sanitizePath("https://example.com/data.csv")).toBe(
				"https://example.com/data.csv",
			);
		});
	});

	describe("traversal rejection", () => {
		it("rejects simple ../ traversal", () => {
			expect(() => sanitizePath("../etc/passwd")).toThrow(OmniReadError);
		});

		it("rejects ../ traversal with error message containing 'directory traversal'", () => {
			expect(() => sanitizePath("../etc/passwd")).toThrow(
				"directory traversal",
			);
		});

		it("rejects traversal within path", () => {
			expect(() => sanitizePath("data/../../etc/passwd")).toThrow(
				OmniReadError,
			);
		});

		it("rejects traversal within path - error message", () => {
			expect(() => sanitizePath("data/../../etc/passwd")).toThrow(
				"directory traversal",
			);
		});

		it("rejects backslash traversal", () => {
			expect(() => sanitizePath("data/..\\etc\\passwd")).toThrow(OmniReadError);
		});

		it("rejects backslash traversal - error message", () => {
			expect(() => sanitizePath("data/..\\etc\\passwd")).toThrow(
				"directory traversal",
			);
		});

		it("rejects path that is just double-dot", () => {
			expect(() => sanitizePath("..")).toThrow(OmniReadError);
		});

		it("preserves original path in OmniReadError.path property", () => {
			const traversalPath = "../etc/passwd";
			try {
				sanitizePath(traversalPath);
				throw new Error("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(OmniReadError);
				expect((e as OmniReadError).path).toBe(traversalPath);
			}
		});
	});

	describe("empty path rejection", () => {
		it("rejects empty string", () => {
			expect(() => sanitizePath("")).toThrow(OmniReadError);
		});

		it("rejects empty string with message containing 'empty'", () => {
			expect(() => sanitizePath("")).toThrow("empty");
		});
	});
});
