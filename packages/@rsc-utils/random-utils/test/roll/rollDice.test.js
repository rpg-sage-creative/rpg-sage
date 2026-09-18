import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { rollDice, MaxDiceCount, MaxDieSides } from "../../build/index.js";

describe("random", () => {
	describe("rollDice", () => {

		const buildTest = (count, { sides }) => {
			if (typeof(count) !== "number") return { count, sides, values:[], throws:true };
			if (typeof(sides) !== "number") return { count, sides, values:[], throws:true };
			if (count < 1 || count > MaxDiceCount) return { count, sides, values:[] };
			if (!sides || sides < 1 || sides > MaxDieSides) return { count, sides, values:[] };
			if (sides === 1) return { count, sides, values:[count] };
			if (sides !== Math.round(sides)) return { count, sides, values:[], throws:true };
			return { count, sides, values: new Array(sides).fill().map((_, i)=>i + 1) };
		};

		const tests = [
			// null counts as 0; but as it is typed we shouldn't have to worry about it
			{ sides:null },

			{ sides:undefined },
			{ sides:"null" },

			{ sides:-1     },
			{ sides:0,     },
			{ sides:1,     },
			{ sides:1.2,   },
			{ sides:2,     },
			{ sides:3,     },
			{ sides:4,     },
			{ sides:6,     },
			{ sides:8,     },
			{ sides:10,    },
			{ sides:12,    },
			{ sides:20,    },
			{ sides:30,    },
			{ sides:100,   },
			{ sides:500,   },
			{ sides:1000,  },
			{ sides:10000, },
		]
		.map((test) => [null,-1,0,1,2,3,100,1000,"null"].map(count => buildTest(count, test)))
		.flat();

		tests.forEach(({ count, sides, values, throws }) => {
			if (throws) {
				test(tagLiterals`rollDice(${count}, ${sides}) to throw`, () => {
					expect(() => rollDice(count, sides)).toThrow();
				});
			}else if (!values.length) {
				test(tagLiterals`rollDice(${count}, ${sides}) to be []`, () => {
					for (let i = 0; i < 1000; i++) {
						expect(rollDice(count, sides)).toEqual([]);
					}
				});
			}else if (sides === 1) {
				test(tagLiterals`rollDice(${count}, ${sides}) to be ${[count]}`, () => {
					for (let i = 0; i < 1000; i++) {
						expect(rollDice(count, sides)).toEqual([count]);
					}
				});
			}else {
				test(tagLiterals`rollDice(${count}, ${sides}) to be in ${values.length?[values[0],"...",values[values.length-1]]:[]}`, () => {
					for (let i = 0; i < 1000; i++) {
						const rolls = rollDice(count, sides);
						rolls.every(roll => expect(values.includes(roll)).toBe(true));
					}
				});
			}
		});

	});
});
