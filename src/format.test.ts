import { describe, expect, it } from "vitest";
import { detectFormat } from "./format.js";

describe("detectFormat", () => {
	describe("known extensions", () => {
		it("maps .json to json", () => {
			expect(detectFormat("data.json")).toBe("json");
		});

		it("maps .csv to csv", () => {
			expect(detectFormat("data.csv")).toBe("csv");
		});

		it("maps .tsv to tsv", () => {
			expect(detectFormat("data.tsv")).toBe("tsv");
		});

		it("maps .tab to tsv", () => {
			expect(detectFormat("data.tab")).toBe("tsv");
		});

		it("maps .txt to text", () => {
			expect(detectFormat("readme.txt")).toBe("text");
		});

		it("maps .md to text", () => {
			expect(detectFormat("readme.md")).toBe("text");
		});

		it("maps .log to text", () => {
			expect(detectFormat("app.log")).toBe("text");
		});

		it("maps .text to text", () => {
			expect(detectFormat("file.text")).toBe("text");
		});

		it("maps .xml to xml", () => {
			expect(detectFormat("data.xml")).toBe("xml");
		});
	});

	describe("unknown extensions", () => {
		it("returns null for unknown extension", () => {
			expect(detectFormat("unknown.xyz")).toBeNull();
		});

		it("returns null for no extension", () => {
			expect(detectFormat("Makefile")).toBeNull();
		});
	});

	describe("case insensitivity", () => {
		it("maps .JSON (uppercase) to json", () => {
			expect(detectFormat("file.JSON")).toBe("json");
		});

		it("maps .CSV (uppercase) to csv", () => {
			expect(detectFormat("file.CSV")).toBe("csv");
		});
	});

	describe("URL paths", () => {
		it("detects format from URL path", () => {
			expect(detectFormat("https://api.example.com/data.csv")).toBe("csv");
		});

		it("detects format from URL with query string", () => {
			expect(detectFormat("https://api.example.com/data.json?v=1")).toBe(
				"json",
			);
		});

		it("detects format from URL with path segments", () => {
			expect(detectFormat("https://example.com/api/v1/data.tsv")).toBe("tsv");
		});
	});

	describe("mime type hint", () => {
		it("uses mime hint text/csv to return csv", () => {
			expect(detectFormat("file.csv", "text/csv")).toBe("csv");
		});

		it("mime hint application/json returns json", () => {
			expect(detectFormat("file", "application/json")).toBe("json");
		});

		it("mime hint text/plain returns text", () => {
			expect(detectFormat("file", "text/plain")).toBe("text");
		});

		it("mime hint text/xml returns xml", () => {
			expect(detectFormat("file", "text/xml")).toBe("xml");
		});

		it("mime hint application/xml returns xml", () => {
			expect(detectFormat("file", "application/xml")).toBe("xml");
		});

		it("unknown mime hint falls back to extension", () => {
			expect(detectFormat("file.json", "application/octet-stream")).toBe(
				"json",
			);
		});

		it("unknown mime hint and no extension returns null", () => {
			expect(detectFormat("file", "application/octet-stream")).toBeNull();
		});
	});
});
