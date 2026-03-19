import { describe, expect, it } from "vitest";
import { csvParser, csvSerializer, tsvParser, tsvSerializer } from "./csv.js";

describe("csvParser", () => {
	it("parse('a,b\\n1,2') returns [['a','b'],['1','2']]", () => {
		expect(csvParser.parse("a,b\n1,2")).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("parse('name,age\\nAlice,30') returns [['name','age'],['Alice','30']]", () => {
		expect(csvParser.parse("name,age\nAlice,30")).toEqual([
			["name", "age"],
			["Alice", "30"],
		]);
	});

	it("parse(Uint8Array of 'a,b\\n1,2') returns [['a','b'],['1','2']]", () => {
		const bytes = new TextEncoder().encode("a,b\n1,2");
		expect(csvParser.parse(bytes)).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("parse('') returns []", () => {
		expect(csvParser.parse("")).toEqual([]);
	});

	it("parse handles RFC 4180 quoted fields", () => {
		expect(csvParser.parse('value with "quotes",normal')).toEqual([
			['value with "quotes"', "normal"],
		]);
	});
});

describe("tsvParser", () => {
	it("parse('a\\tb\\n1\\t2') returns [['a','b'],['1','2']]", () => {
		expect(tsvParser.parse("a\tb\n1\t2")).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("parse(Uint8Array of TSV data) returns array of arrays", () => {
		const bytes = new TextEncoder().encode("a\tb\n1\t2");
		expect(tsvParser.parse(bytes)).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});
});

describe("csvSerializer", () => {
	it("serialize([['a','b'],['1','2']]) returns comma-separated output", () => {
		const result = csvSerializer.serialize([
			["a", "b"],
			["1", "2"],
		]);
		// Accept either \n or \r\n line endings
		expect(result.replace(/\r\n/g, "\n")).toBe("a,b\n1,2");
	});

	it("serialize([['a','b'],['1','2']], { delimiter: ';' }) returns semicolon-separated", () => {
		const result = csvSerializer.serialize(
			[
				["a", "b"],
				["1", "2"],
			],
			{ delimiter: ";" },
		);
		expect(result.replace(/\r\n/g, "\n")).toBe("a;b\n1;2");
	});

	it("serialize([]) returns ''", () => {
		expect(csvSerializer.serialize([])).toBe("");
	});
});

describe("tsvSerializer", () => {
	it("serialize([['a','b'],['1','2']]) returns tab-separated output (NOT comma)", () => {
		const result = tsvSerializer.serialize([
			["a", "b"],
			["1", "2"],
		]);
		// Must contain tabs, not commas
		expect(result).toContain("\t");
		expect(result).not.toContain(",");
		expect(result.replace(/\r\n/g, "\n")).toBe("a\tb\n1\t2");
	});

	it("serialize([]) returns ''", () => {
		expect(tsvSerializer.serialize([])).toBe("");
	});
});
