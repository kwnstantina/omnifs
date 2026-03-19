import { describe, expect, it } from "vitest";
import { textParser, textSerializer } from "./text.js";

describe("textParser", () => {
	it("parse(Uint8Array of 'hello') returns 'hello'", () => {
		const bytes = new TextEncoder().encode("hello");
		expect(textParser.parse(bytes)).toBe("hello");
	});

	it("parse(Uint8Array with UTF-8 BOM + 'hello') returns 'hello'", () => {
		const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
		const content = new TextEncoder().encode("hello");
		const bytes = new Uint8Array(bom.length + content.length);
		bytes.set(bom, 0);
		bytes.set(content, bom.length);
		expect(textParser.parse(bytes)).toBe("hello");
	});

	it("parse('hello') returns 'hello' (string passthrough)", () => {
		expect(textParser.parse("hello")).toBe("hello");
	});

	it("parse(empty Uint8Array) returns ''", () => {
		expect(textParser.parse(new Uint8Array(0))).toBe("");
	});

	it("parse(Uint8Array of UTF-8 multibyte string) returns correct string", () => {
		const str = "cafe\u0301"; // café with combining accent
		const bytes = new TextEncoder().encode(str);
		expect(textParser.parse(bytes)).toBe(str);
	});
});

describe("textSerializer", () => {
	it("serialize('hello') returns 'hello'", () => {
		expect(textSerializer.serialize("hello")).toBe("hello");
	});

	it("serialize('') returns ''", () => {
		expect(textSerializer.serialize("")).toBe("");
	});
});
