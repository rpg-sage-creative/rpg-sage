import { describe, expect, test } from "vitest";
import { tokenize } from "../build/index.js";

describe("tokenize", () => {

	test(`tokenizes words, whitespace, and punctuation`, () => {
		const tokens = tokenize(`this is text.`, { word:/\w+/, whitespace:/\s+/, punctuation:/[^\w\s]/ }, `invalid`);
		expect(tokens).toStrictEqual([
			{ key:`word`, groups:{}, matches:[], token:`this` },
			{ key:`whitespace`, groups:{}, matches:[], token:` ` },
			{ key:`word`, groups:{}, matches:[], token:`is` },
			{ key:`whitespace`, groups:{}, matches:[], token:` ` },
			{ key:`word`, groups:{}, matches:[], token:`text` },
			{ key:`punctuation`, groups:{}, matches:[], token:`.` },
		]);
	});

	test(`captures named groups and match arrays on the winning parser`, () => {
		const tokens = tokenize(`hi first.last!`, { firstDotLast:/(?<first>\w+)\.(?<last>\w+)/, word:/\w+/, whitespace:/\s+/, punctuation:/[^\w\s]/ }, `invalid`);
		expect(tokens).toStrictEqual([
			{ key:`word`, groups:{}, matches:[], token:`hi` },
			{ key:`whitespace`, groups:{}, matches:[], token:` ` },
			{ key:`firstDotLast`, groups:{ first:`first`, last:`last` }, matches:[`first`, `last`], token:`first.last` },
			{ key:`punctuation`, groups:{}, matches:[], token:`!` },
		]);
	});

	test(`the defaultKey is "unknown" when not given`, () => {
		const tokens = tokenize(`ab-cd`, { word:/\w+/ });
		expect(tokens.map(token => ({ key:token.key, token:token.token }))).toStrictEqual([
			{ key:`word`, token:`ab` },
			{ key:`unknown`, token:`-` },
			{ key:`word`, token:`cd` },
		]);
	});

	test(`text between matches is emitted as a default/unknown token`, () => {
		const tokens = tokenize(`ab-cd`, { word:/\w+/ }, `invalid`);
		expect(tokens[1]).toStrictEqual({ key:`invalid`, groups:{}, matches:[], token:`-` });
	});

	test(`tokenize("") === []`, () => {
		expect(tokenize(``, { word:/\w+/ })).toEqual([]);
	});

	test(`input with no matching parsers becomes a single default token`, () => {
		expect(tokenize(`abc`, {}, `invalid`).map(token => ({ key:token.key, token:token.token }))).toStrictEqual([
			{ key:`invalid`, token:`abc` },
		]);
	});

	test(`the parser matching closest to the current position wins`, () => {
		const tokens = tokenize(`a123`, { later:/12/, first:/a/ });
		expect(tokens.map(token => ({ key:token.key, token:token.token }))).toStrictEqual([
			{ key:`first`, token:`a` },
			{ key:`later`, token:`12` },
			{ key:`unknown`, token:`3` },
		]);
	});

	test(`on equal match positions the first parser wins`, () => {
		const tokens = tokenize(`abc`, { one:/\w+/, two:/\w+/ });
		expect(tokens.map(token => ({ key:token.key, token:token.token }))).toStrictEqual([
			{ key:`one`, token:`abc` },
		]);
	});

	test(`a parser matching later in the string is chosen over unmatched text`, () => {
		const tokens = tokenize(`!!ab`, { word:/\w+/ });
		expect(tokens.map(token => ({ key:token.key, token:token.token }))).toStrictEqual([
			{ key:`unknown`, token:`!!` },
			{ key:`word`, token:`ab` },
		]);
	});

});
