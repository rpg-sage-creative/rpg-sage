import { toLiteral } from "@rsc-utils/core-utils";
import { getEmojiRegex } from "../../build/index.js";

describe("emoji", () => {
	describe("getEmojiRegex", () => {

		const tests = [
			{ options:{}, input:"one 💯 hundred", testResult:true, execResults:["💯"], matchResults:["💯"] },
			{ options:{}, input:"one 💯 hundred 💯", testResult:true, execResults:["💯"], matchResults:["💯", "💯"] },

			{ options:{}, input:"one 💯💯 hundred 💯", testResult:true, execResults:["💯"], matchResults:["💯", "💯", "💯"] },
			{ options:{quantifier:"+"}, input:"one 💯💯 hundred 💯", testResult:true, execResults:["💯💯"], matchResults:["💯💯", "💯"] },
			{ options:{quantifier:"{3,}"}, input:"one 💯💯 hundred 💯", testResult:false, execResults:null, matchResults:null },

			{ options:{capture:"emoji"}, input:"one 💯 hundred 💯", testResult:true, execResults:["💯", "💯"], matchResults:["💯", "💯"], captureGroup:"emoji", captureValue:"💯" },

			{ options:{}, input:"sage <:sage_heart_eyes:1159195747745538140> eyes", testResult:true, execResults:["<:sage_heart_eyes:1159195747745538140>"], matchResults:["<:sage_heart_eyes:1159195747745538140>"] },
			{ options:{}, input:"sage <a:sage_heart_eyes:1159195747745538140> eyes", testResult:true, execResults:["<a:sage_heart_eyes:1159195747745538140>"], matchResults:["<a:sage_heart_eyes:1159195747745538140>"] },
			// { options:{}, input:"INPUT", testResult:false, execResults:null, matchResults:null },
		];

		tests.forEach(({ options, input, testResult, execResults, matchResults, captureGroup, captureValue }) => {
			test(`getEmojiRegex(${toLiteral(options)}).test(${toLiteral(input)})`, () => {
				expect(getEmojiRegex(options).test(input)).toBe(testResult);
			});
			test(`getEmojiRegex(${toLiteral(options)}).exec(${toLiteral(input)}) equals ${toLiteral(execResults)}`, () => {
				const results = getEmojiRegex(options).exec(input);
				if (execResults === null) {
					expect(results).toBeNull();
				}else {
					expect(String(results)).toBe(String(execResults));
				}
			});
			if (captureGroup || captureValue) {
				test(`getEmojiRegex(${toLiteral(options)}).exec(${toLiteral(input)}).${captureGroup} === ${toLiteral(captureValue)}`, () => {
					const results = getEmojiRegex(options).exec(input);
					expect(results?.groups?.[captureGroup]).toBe(captureValue);
				});
			}
			test(`${toLiteral(input)}.match(getEmojiRegex(${toLiteral({...options,gFlag:"g"})})) equals ${toLiteral(matchResults)}`, () => {
				if (matchResults === null) {
					expect(input.match(getEmojiRegex({...options,gFlag:"g"}))).toBeNull();
				}else {
					expect(String(input.match(getEmojiRegex({...options,gFlag:"g"})))).toBe(String(matchResults));
				}
			});
		});

	});
});