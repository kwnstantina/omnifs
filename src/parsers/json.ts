import { OmniReadError } from "../errors.js";
import { textParser } from "./text.js";

/**
 * JSON parser and serializer.
 * Uses textParser for BOM stripping before JSON.parse.
 */

export const jsonParser = {
	parse(data: Uint8Array | string): unknown {
		const str = textParser.parse(data);
		try {
			return JSON.parse(str);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			throw new OmniReadError(`Invalid JSON: ${msg}`, "", "json");
		}
	},
};

export const jsonSerializer = {
	serialize(data: unknown, options?: Record<string, unknown>): string {
		if (options?.pretty) {
			return JSON.stringify(data, null, 2);
		}
		return JSON.stringify(data);
	},
};
