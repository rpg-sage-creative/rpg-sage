import { pause, tagLiterals } from "../../build/index.js";

describe("pause", () => {

	const ms = 100;

	test(`${ms} ms should pass and return undefined`, async () => {
		const start = Date.now();
		const retVoid = await pause(ms, "retVoid");
		const stop = Date.now();
		const span = stop - start;
		expect(span).toBeGreaterThanOrEqual(ms);
		expect(retVoid).toBe(undefined);
	});

	const obj = { "a":"B" };
	test(tagLiterals`${ms} ms should pass and return ${obj}`, async () => {
		const start = Date.now();
		const retObj = await pause({ ms, label:"retObj", data:obj, log:true });
		const stop = Date.now();
		const span = stop - start;
		expect(span).toBeGreaterThanOrEqual(ms);
		expect(retObj).toBe(obj);
	});

});
