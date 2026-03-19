import { OmniFormatError } from "../errors.js";
import { csvParser, csvSerializer, tsvParser, tsvSerializer } from "./csv.js";
import { jsonParser, jsonSerializer } from "./json.js";
import { textParser, textSerializer } from "./text.js";
import type { FormatName, Parser, Serializer } from "./types.js";

/**
 * Get the parser for a given format name.
 * @throws OmniFormatError for unsupported formats
 */
export function getParser(format: FormatName): Parser {
	switch (format) {
		case "text":
			return textParser;
		case "json":
			return jsonParser;
		case "csv":
			return csvParser;
		case "tsv":
			return tsvParser;
		case "xml":
			throw new OmniFormatError(
				"XML parsing requires the lite binary drivers (Phase 3)",
				"xml",
				"Install omnifs lite drivers or use a dedicated XML parser",
			);
		default:
			throw new OmniFormatError(
				`No parser available for format: ${format as string}`,
				format as string,
			);
	}
}

/**
 * Get the serializer for a given format name.
 * @throws OmniFormatError for unsupported formats
 */
export function getSerializer(format: FormatName): Serializer {
	switch (format) {
		case "text":
			return textSerializer;
		case "json":
			return jsonSerializer;
		case "csv":
			return csvSerializer;
		case "tsv":
			// CRITICAL: return tsvSerializer (tab-delimited), NOT csvSerializer
			return tsvSerializer;
		case "xml":
			throw new OmniFormatError("XML serialization is not supported", "xml");
		default:
			throw new OmniFormatError(
				`No serializer available for format: ${format as string}`,
				format as string,
			);
	}
}
