import papaparse from "papaparse";
import { textParser } from "./text.js";

/**
 * CSV and TSV parsers and serializers via papaparse.
 */

export const csvParser = {
	parse(
		data: Uint8Array | string,
		options?: Record<string, unknown>,
	): string[][] {
		const str = textParser.parse(data);
		if (str === "") return [];
		const result = papaparse.parse<string[]>(str, {
			header: false,
			skipEmptyLines: true,
			delimiter: (options?.delimiter as string) ?? ",",
		});
		return result.data;
	},
};

export const tsvParser = {
	parse(
		data: Uint8Array | string,
		options?: Record<string, unknown>,
	): string[][] {
		const str = textParser.parse(data);
		if (str === "") return [];
		const result = papaparse.parse<string[]>(str, {
			header: false,
			skipEmptyLines: true,
			delimiter: (options?.delimiter as string) ?? "\t",
		});
		return result.data;
	},
};

export const csvSerializer = {
	serialize(data: string[][], options?: Record<string, unknown>): string {
		if (data.length === 0) return "";
		return papaparse.unparse(data, {
			delimiter: (options?.delimiter as string) ?? ",",
		});
	},
};

export const tsvSerializer = {
	serialize(data: string[][]): string {
		if (data.length === 0) return "";
		// Always use tab delimiter regardless of options — critical for .tsv correctness
		return papaparse.unparse(data, {
			delimiter: "\t",
		});
	},
};
