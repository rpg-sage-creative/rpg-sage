import { ELLIPSIS, tagLiterals, truncate } from "../../build/index.js";

describe("string", () => {
	describe("truncate", () => {

		const tests = [
			{ input:`1234567890`, length:5, options:undefined, expected:`12345` },
			{ input:`1234567890`, length:5, options:true, expected:`1234`+ELLIPSIS },
			{ input:`1234567890`, length:5, options:"...", expected:`12...` },
		];
		tests.forEach(({ input, length, options, expected }) => {
			test(tagLiterals`truncate(${input}, ${length}, ${options}) === ${expected}`, () => {
				expect(truncate(input, length, options)).toBe(expected);
			});
		});

	});
});
