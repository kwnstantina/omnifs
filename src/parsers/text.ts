/**
 * Text parser and serializer.
 * Handles UTF-8 BOM stripping for both Uint8Array and string inputs.
 */

const decoder = new TextDecoder("utf-8");

export const textParser = {
	parse(data: Uint8Array | string): string {
		if (typeof data === "string") {
			// Strip U+FEFF BOM from string start
			return data.startsWith("\uFEFF") ? data.slice(1) : data;
		}
		// Strip UTF-8 BOM bytes (0xEF 0xBB 0xBF) before decoding
		if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
			return decoder.decode(data.subarray(3));
		}
		return decoder.decode(data);
	},
};

export const textSerializer = {
	serialize(data: string): string {
		return String(data);
	},
};
