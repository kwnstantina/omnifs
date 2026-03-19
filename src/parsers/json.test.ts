import { describe, expect, it } from "vitest";
import { OmniReadError } from "../errors.js";
import { jsonParser, jsonSerializer } from "./json.js";

describe("jsonParser", () => {
	it("parse(Uint8Array of '{\"a\":1}') returns { a: 1 }", () => {
		const bytes = new TextEncoder().encode('{"a":1}');
		expect(jsonParser.parse(bytes)).toEqual({ a: 1 });
	});

	it("parse('[1,2,3]') returns [1, 2, 3]", () => {
		expect(jsonParser.parse("[1,2,3]")).toEqual([1, 2, 3]);
	});

	it("parse(Uint8Array with BOM + '{\"a\":1}') returns { a: 1 }", () => {
		const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
		const content = new TextEncoder().encode('{"a":1}');
		const bytes = new Uint8Array(bom.length + content.length);
		bytes.set(bom, 0);
		bytes.set(content, bom.length);
		expect(jsonParser.parse(bytes)).toEqual({ a: 1 });
	});

	it("parse('invalid json') throws OmniReadError", () => {
		expect(() => jsonParser.parse("invalid json")).toThrow(OmniReadError);
	});

	it("parse('') throws OmniReadError", () => {
		expect(() => jsonParser.parse("")).toThrow(OmniReadError);
	});
});

describe("jsonSerializer", () => {
	it("serialize({ a: 1 }) returns '{\"a\":1}' (compact by default)", () => {
		expect(jsonSerializer.serialize({ a: 1 })).toBe('{"a":1}');
	});

	it("serialize({ a: 1 }, { pretty: true }) returns pretty-printed JSON", () => {
		const result = jsonSerializer.serialize({ a: 1 }, { pretty: true });
		expect(result).toBe('{\n  "a": 1\n}');
	});

	it("serialize([1, 2]) returns '[1,2]'", () => {
		expect(jsonSerializer.serialize([1, 2])).toBe("[1,2]");
	});
});
