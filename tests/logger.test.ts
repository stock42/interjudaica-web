import { describe, expect, test } from "bun:test";

import { serializeError } from "@/lib/error-utils";

describe("serializeError", () => {
	test("keeps Error message and name", () => {
		const value = serializeError(new TypeError("bad things"));

		expect(value.message).toBe("bad things");
		expect(value.name).toBe("TypeError");
	});

	test("handles string values", () => {
		const value = serializeError("boom");

		expect(value.message).toBe("boom");
		expect(value.name).toBe("Error");
	});

	test("handles unknown values", () => {
		const value = serializeError({ nope: true });

		expect(value.message).toBe("Unknown error");
		expect(value.name).toBe("UnknownError");
	});
});
