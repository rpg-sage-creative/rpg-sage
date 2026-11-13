import { describe, expect, test } from "vitest";
import { SearchInfo } from "../build/index.js";

const mk = (name: string) => (
	{
		name,
		searchResultCategory: `Cat`,
		source: { code:`SRC` },
		toSearchResult() { return name; },
		search() { return undefined as never; },
		searchRecursive() { return []; }
	}
);

describe("SearchInfo", () => {

	describe("term parsing", () => {

		test(`without the global flag the whole cleaned string is a single term`, () => {
			const si = new SearchInfo(`fireball damage`, ``);
			expect(si.globalFlag).toBe(false);
			expect(si.terms.map(t => t.term)).toEqual([`fireball damage`]);
		});

		test(`the "g" flag splits the search text into individual terms`, () => {
			const si = new SearchInfo(`fireball damage`, `g`);
			expect(si.globalFlag).toBe(true);
			expect(si.terms.map(t => t.term)).toContain(`fireball`);
			expect(si.terms.map(t => t.term)).toContain(`damage`);
		});

		test(`a trailing " -g" modifier enables global matching and is stripped from the term`, () => {
			const si = new SearchInfo(`fire -g`, ``);
			expect(si.globalFlag).toBe(true);
			expect(si.terms.map(t => t.term)).toEqual([`fire`]);
		});

		test(`a trailing " -r" modifier inserts the term into the regex without escaping`, () => {
			const si = new SearchInfo(`a.b -r`, ``);
			expect(si.terms[0].regex?.source).toBe(`(?:a.b)`);
		});

		test(`without the regex flag the interpolated term is auto-escaped by the regex package`, () => {
			const si = new SearchInfo(`a.b`, ``);
			expect(si.terms[0].regex?.source).toBe(`a\\.b`);
		});

		test(`terms get a case-insensitive global regex`, () => {
			const si = new SearchInfo(`fire`, ``);
			expect(si.terms[0].regex?.flags).toContain(`g`);
			expect(si.terms[0].regex?.flags).toContain(`i`);
		});

		test(`leading + and - mark include/exclude terms`, () => {
			const si = new SearchInfo(`+fire -cold`, `g`);
			expect(si.hasPlus).toBe(true);
			expect(si.hasMinus).toBe(true);
			const fire = si.terms.find(t => t.term === `fire`);
			const cold = si.terms.find(t => t.term === `cold`);
			expect(fire?.plus).toBe(true);
			expect(cold?.minus).toBe(true);
		});

		test(`whitespace gap tokens are not kept as terms`, () => {
			const si = new SearchInfo(`fire ball`, `g`);
			expect(si.terms.map(t => t.term)).toEqual([`fire`, `ball`]);
		});

		test(`a whitespace-only search has no terms and matches nothing`, () => {
			const si = new SearchInfo(`   `, ``);
			expect(si.terms).toEqual([]);
			expect(si.test(`anything at all`)).toBe(false);
		});

		test(`an empty search has no terms and matches nothing`, () => {
			const si = new SearchInfo(``, ``);
			expect(si.terms).toEqual([]);
			expect(si.test(`anything`)).toBe(false);
		});

		test(`content matching no search term fails even when it contains spaces`, () => {
			const si = new SearchInfo(`fire ball`, `g`);
			expect(si.test(`foo bar`)).toBe(false);
			expect(si.test(`a fire here`)).toBe(true);
		});

	});

	describe("test()", () => {

		test(`matches case-insensitively against the given contents`, () => {
			expect(new SearchInfo(`fire`, ``).test(`Fire Bolt is fiery`)).toBe(true);
		});

		test(`does not match when no content contains the term`, () => {
			expect(new SearchInfo(`fire`, ``).test(`cold snap`)).toBe(false);
		});

		test(`a minus term excludes content that matches it`, () => {
			const si = new SearchInfo(`-ice fire`, `g`);
			expect(si.test(`fire and ice`)).toBe(false);
			expect(si.test(`just fire`)).toBe(true);
		});

		test(`a required plus term that is missing fails the boolean`, () => {
			const si = new SearchInfo(`+fire ball`, `g`);
			expect(si.test(`ball only`)).toBe(false);
			expect(si.test(`fire and ball`)).toBe(true);
		});

		test(`matches across multiple content strings`, () => {
			expect(new SearchInfo(`needle`, ``).test(`hay`, `stack with needle`)).toBe(true);
		});

	});

	describe("score()", () => {

		test(`counts regex hits across all contents`, () => {
			const score = new SearchInfo(`fire`, ``).score(mk(`Fireball`), `fire fire`, `fire`);
			expect(score.hits).toEqual([3]);
			expect(score.totalHits).toBe(3);
		});

		test(`returns a SearchScore bound to the searchable`, () => {
			const searchable = mk(`Fireball`);
			expect(new SearchInfo(`fire`, ``).score(searchable, `fire`).searchable).toBe(searchable);
		});

	});

	describe("mark()", () => {

		test(`currently returns content unchanged (unimplemented)`, () => {
			const si = new SearchInfo(`fire`, ``);
			expect(si.mark(`a fire`)).toBe(`a fire`);
		});

	});

});
