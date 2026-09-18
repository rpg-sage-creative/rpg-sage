import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { Color } from "../build/index.js";

describe("color", () => {
	describe("Color.from", () => {

		const tests = [
			["#80FF00", {
				names: [],
				hexa: '#80ff00ff',
				hex: '#80ff00',
				rgba: 'rgba(128,255,0,1)',
				rgb: 'rgb(128,255,0)',
				red: 128,
				green: 255,
				blue: 0,
				alpha: 1
			}],
			["rgb(128,255,0)", {
				names: [],
				hexa: '#80ff00ff',
				hex: '#80ff00',
				rgba: 'rgba(128,255,0,1)',
				rgb: 'rgb(128,255,0)',
				red: 128,
				green: 255,
				blue: 0,
				alpha: 1
			}],
			["#80FF0080", {
				names: [],
				hexa: '#80ff0080',
				hex: '#80ff00',
				rgba: 'rgba(128,255,0,0.5)',
				rgb: 'rgb(128,255,0)',
				red: 128,
				green: 255,
				blue: 0,
				alpha: 0.5
			}],
		];

		tests.forEach(([input, data]) => {
			test(tagLiterals`Color.from(${input}).data === ${data}`, () => {
				expect(Color.from(input)?.data).toEqual(data);
			});
		});

	});
});
