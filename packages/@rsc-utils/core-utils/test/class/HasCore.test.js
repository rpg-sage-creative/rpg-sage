import { HasCore } from "../../build/index.js";

class HasCoreTester extends HasCore { }

describe("class", () => {
	describe("HasCore", () => {

		const hasCore = new HasCoreTester({ objectType:"Tester" });

		test(`hasCore.is(hasCore)`, () => {
			expect(hasCore.is(hasCore)).toBe(true);
		});

		test(`hasCore.is(hasCore.core)`, () => {
			expect(hasCore.is(hasCore.core)).toBe(true);
		});

		test(`hasCore.is({core:hasCore.core})`, () => {
			expect(hasCore.is({core:hasCore.core})).toBe(true);
		});

		test(`hasCore.is(hasCore.toJSON())`, () => {
			expect(hasCore.is(hasCore.toJSON())).toBe(true);
		});

		test(`hasCore.is(null)`, () => {
			expect(hasCore.is(null)).toBe(false);
		});

		test(`hasCore.is(new HasCoreTester({ objectType:"Tester" }))`, () => {
			expect(hasCore.is(new HasCoreTester({ objectType:"Tester" }))).toBe(false);
		});

	});
});
