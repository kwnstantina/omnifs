import { describe, expect, it } from "vitest";
import { bunBackend } from "./bun.js";
import { denoBackend } from "./deno.js";
import { nodeBackend } from "./node.js";

describe("server backends - structural tests", () => {
	it("nodeBackend implements IOBackend interface", () => {
		expect(typeof nodeBackend.readBytes).toBe("function");
		expect(typeof nodeBackend.writeBytes).toBe("function");
		expect(typeof nodeBackend.writeAtomic).toBe("function");
		expect(typeof nodeBackend.readStream).toBe("function");
	});

	it("bunBackend implements IOBackend interface", () => {
		expect(typeof bunBackend.readBytes).toBe("function");
		expect(typeof bunBackend.writeBytes).toBe("function");
		expect(typeof bunBackend.writeAtomic).toBe("function");
		expect(typeof bunBackend.readStream).toBe("function");
	});

	it("denoBackend implements IOBackend interface", () => {
		expect(typeof denoBackend.readBytes).toBe("function");
		expect(typeof denoBackend.writeBytes).toBe("function");
		expect(typeof denoBackend.writeAtomic).toBe("function");
		expect(typeof denoBackend.readStream).toBe("function");
	});
});
