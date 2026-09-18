import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { rollDiceString } from "../../build/index.js";

describe("random", () => {
	describe("rollDiceString", () => {

		const buildTest = (count, sides) => {
			const absCount = Math.abs(count);
			let values = [];
			// if (!+count || count < 1) values = [];
			// else
				if (!+sides || sides < 1) values = new Array(absCount).fill(0);
			else values = new Array(Math.abs(count * sides)).fill(0).map((_,i)=>i+1).slice(absCount-1);
			return [{
				count,
				sides,
				diceString: `${count}d${sides}`,
				values
			}, {
				count,
				sides,
				diceString: ` ${count} d ${sides} + 0`,
				values
			}];
		};

		const tests = [
			// null counts as 0; but as it is typed we shouldn't have to worry about it
			{ sides:null, values:[0], throws:false },

			{ sides:undefined, values:[0], throws:true },
			{ sides:"null", values:[0], throws:true },

			{ sides:-1, values:[0], throws:false },
			{ sides:0, values:[0], throws:false },
			{ sides:1, throws:false },
			{ sides:2,throws:false },
			{ sides:3, throws:false },
			{ sides:4,  throws:false },
			{ sides:6,  throws:false },
			{ sides:8,  throws:false },
			{ sides:10, throws:false },
			{ sides:12,  throws:false },
			{ sides:20, throws:false },
			{ sides:30, throws:false },
			{ sides:100,  throws:false },
		]
		.map((test) => [-1,0,1,2,3].map(count => buildTest(count, test.sides)))
		.flat(2);

		tests.forEach(({ count, sides, diceString, values, throws }) => {
			if (!throws) {
				test(tagLiterals`rollDiceString(${diceString}) to be in ${values.length?[values[0],"...",values[values.length-1]]:[]}`, () => {
					for (let i = 0; i < 1000; i++) {
						const roll = rollDiceString(diceString);
						if (typeof(sides) !== "number" || sides < 0) {
							expect(roll).toBeUndefined();
						}else if (!count) {
							expect(roll).toBe(0);
						}else if (count < 0) {
							expect(values.includes(-roll)).toBe(true);
						}else {
							expect(values.includes(roll)).toBe(true);
						}
					}
				});

			}else {
				test(tagLiterals`rollDiceString(${diceString}) to throw`, () => {
					expect(() => rollDiceString(diceString)).toThrow();
				});
			}
		});

	});
});
