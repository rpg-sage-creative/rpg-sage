import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { rollDie, MaxDieSides } from "../../build/index.js";

describe("random", () => {
	describe("rollDie", () => {

		const array = sides => sides < 1 || sides > MaxDieSides ? [0] : new Array(sides).fill().map((_, i) => i + 1);

		const tests = [
			// null counts as 0; but as it is typed we shouldn't have to worry about it
			{ sides:null, throws:true },

			{ sides:undefined, throws:true },
			{ sides:"null", throws:true },

			{ sides:-1, },
			{ sides:0,},
			{ sides:1,},
			{ sides:1.2, throws:true },
			{ sides:2, },
			{ sides:3,},
			{ sides:4, },
			{ sides:6, },
			{ sides:8, },
			{ sides:10, },
			{ sides:12,  },
			{ sides:20,  },
			{ sides:30,  },
			{ sides:100,  },
			{ sides:1000,  },
			{ sides:10000, },
		].map(({ sides, throws }) => ({ sides, throws, values:throws?[]:array(sides) }));

		tests.forEach(({ sides, values, throws }) => {
			if (!throws) {
				test(tagLiterals`rollDie(${sides}) to be in ${[values[0],"...",values[values.length-1]]}`, () => {
					for (let i = 0; i < 1000; i++) {
						expect(values.includes(rollDie(sides))).toBe(true);
					}
				});

			}else {
				test(tagLiterals`rollDie(${sides}) to throw`, () => {
					expect(() => rollDie(sides)).toThrow();
				});
			}
		});

	});
});
