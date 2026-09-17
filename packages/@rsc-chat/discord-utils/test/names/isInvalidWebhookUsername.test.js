import { toLiteral } from "@rsc-utils/core-utils";
import { isInvalidWebhookUsername } from "../../build/index.js";

/** returns all the letters that might be used to create a variant of a username */
function getLetterVariants(letter) {
	switch(letter) {
		case "e": return "eë3";
		case "i": return "il1";
		case "o": return "o0";
		case "s": return "s5";
		default: return letter;
	}
}

/**
 * uses getLetterVariants to create every unique variant of a username
 * @param {string} value
 */
function createVariants(value) {
	if (!value) return [];

	const variants = new Set([value]);

	const letters = value.split("").map(getLetterVariants);

	letters.forEach((chars, letterIndex) => {
		chars.split("").forEach(char => {
			[...variants].forEach(variant => {
				const word = variant.split("");
				word[letterIndex] = char;
				variants.add(word.join(""));
				// variants.add(word.join("").toUpperCase());
			});
		});
	});

	return [...variants];
}

describe("names", () => {
	describe("isInvalidWebhookUsername", () => {

		describe("control values", () => {

			const tests = [
				{ input:"Accord", expected:false },
				{ input:"Dismantle", expected:false },

				{ input:undefined, expected:true },
				{ input:null, expected:true },
				{ input:"", expected:true },
				{ input:"".padEnd("a", 81), expected:true },
			];

			tests.forEach(({ input, expected }) => {
				test(`isInvalidWebhookUsername(${toLiteral(input)}) === ${toLiteral(expected)}`, () => {
					expect(isInvalidWebhookUsername(input)).toBe(expected);
				});
			});

		});

		const tests = [
			{ name:"everyone" },
			{ name:"here" },

			{ name:"discord",  variants:true },
			{ name:"clyde"     },
			{ name:"wumpus",   },

			{ name:"```" },
		];

		tests.forEach(({ name, anchored, variants }) => {

			describe(`"${name}"`, () => {

				// no name is allowed to be one of the banned names, regardless of l33t spelling
				const anchoredTests = createVariants(name).map(variant => variants
					? ({ variant, expected:name })
					: ({ variant, expected:variant.toLowerCase() === name.toLowerCase() ? name : false })
				);

				anchoredTests.forEach(({ variant, expected }) => {
					test(`isInvalidWebhookUsername(${toLiteral(variant)}) === ${toLiteral(expected)}`, () => {
						expect(isInvalidWebhookUsername(variant)).toBe(expected);
					});
				});

				// those NOT marked as anchored cannot appear anywhere in the name
				const unanchoredTests = anchoredTests.map(({ variant, expected }) =>
					({ variant:`${variant} unanchored`, expected:anchored?false:expected })
				);

				unanchoredTests.forEach(({ variant, expected }) => {
					test(`isInvalidWebhookUsername(${toLiteral(variant)}) === ${toLiteral(expected)}`, () => {
						expect(isInvalidWebhookUsername(variant)).toBe(expected);
					});
				});

			});

		});

	});
});
