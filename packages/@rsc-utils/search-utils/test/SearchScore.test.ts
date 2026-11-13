import { describe, expect, test } from "vitest";
import { SearchScore } from "../build/index.js";

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

type TermData = { term:string; regex?:RegExp; plus:boolean; minus:boolean };
const term = (t: string, opts: Partial<TermData> = {}): TermData => (
	{ term:t, plus:false, minus:false, ...opts }
);

describe("SearchScore", () => {

	describe("add()", () => {

		test(`adds new terms with their hit counts`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 2);
			expect(score.terms.map(t => t.term)).toEqual([`a`]);
			expect(score.hits).toEqual([2]);
		});

		test(`adding the same term again accumulates hits instead of duplicating`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 2);
			score.add(term(`a`), 3);
			expect(score.hits).toEqual([5]);
		});

		test(`adding the same term text with different flags keeps separate entries`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`fire`), 1);
			score.add(term(`fire`, { plus:true }), 0);
			expect(score.terms.length).toBe(2);
			expect(score.hits).toEqual([1, 0]);
		});

		test(`a plain hit does not satisfy the same term required as a plus term`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`fire`), 3);
			score.add(term(`fire`, { plus:true }), 0);
			expect(score.plusMatches).toBe(-1);
			expect(score.bool).toBe(false);
		});

	});

	describe("match getters", () => {

		test(`minusMatches is -1 when a minus term has hits`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`bad`, { minus:true }), 1);
			expect(score.minusMatches).toBe(-1);
		});

		test(`minusMatches is 1 when a minus term has no hits`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`bad`, { minus:true }), 0);
			expect(score.minusMatches).toBe(1);
		});

		test(`minusMatches is 0 when there are no minus terms`, () => {
			expect(new SearchScore(mk(`X`)).minusMatches).toBe(0);
		});

		test(`plusMatches is -1 when a required plus term has no hits`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`need`, { plus:true }), 0);
			expect(score.plusMatches).toBe(-1);
		});

		test(`otherMatches is 1 when a plain term has hits and -1 when none do`, () => {
			const hit = new SearchScore(mk(`X`));
			hit.add(term(`a`), 1);
			expect(hit.otherMatches).toBe(1);
			const miss = new SearchScore(mk(`X`));
			miss.add(term(`a`), 0);
			expect(miss.otherMatches).toBe(-1);
		});

	});

	describe("bool", () => {

		test(`true when a plain term matches`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 1);
			expect(score.bool).toBe(true);
		});

		test(`false when a minus term matches`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 1);
			score.add(term(`bad`, { minus:true }), 1);
			expect(score.bool).toBe(false);
		});

		test(`bool is false when a required plus term is missing even if another term matches`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`need`, { plus:true }), 0);
			score.add(term(`a`), 1);
			expect(score.bool).toBe(false);
		});

		test(`bool is false when one of several required plus terms is missing`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`need1`, { plus:true }), 2);
			score.add(term(`need2`, { plus:true }), 0);
			expect(score.bool).toBe(false);
		});

		test(`bool is false for an exclusion-only score even when no excluded term hits (exclusion-only queries never match by design)`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`bad`, { minus:true }), 0);
			expect(score.bool).toBe(false);
		});

		test(`bool is false for a score with no terms at all`, () => {
			expect(new SearchScore(mk(`X`)).bool).toBe(false);
		});

		test(`bool is false when a plain term exists but none of the plain terms hit`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`need`, { plus:true }), 2);
			score.add(term(`a`), 0);
			expect(score.bool).toBe(false);
		});

		test(`bool is false when no terms hit at all`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 0);
			expect(score.bool).toBe(false);
		});

		test(`true when only plus terms exist and all match`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`need`, { plus:true }), 2);
			expect(score.bool).toBe(true);
		});

	});

	describe("totalScore", () => {

		test(`scores by hit count`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 3);
			expect(score.totalScore).toBe(3);
		});

		test(`doubles the score when the term is contained in the name`, () => {
			const score = new SearchScore(mk(`Fireball`));
			score.add(term(`ball`), 1);
			expect(score.totalScore).toBe(2);
		});

		test(`the name bonus applies case-insensitively, matching the /gi term regexes`, () => {
			const score = new SearchScore(mk(`Fireball`));
			score.add(term(`fire`), 1);
			expect(score.totalScore).toBe(2);
		});

		test(`multiplies minus terms by -5`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`bad`, { minus:true }), 1);
			expect(score.totalScore).toBe(-5);
		});

		test(`multiplies plus terms by 5`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`need`, { plus:true }), 1);
			expect(score.totalScore).toBe(5);
		});

	});

	describe("fail(), append(), and concat()", () => {

		test(`fail() forces bool false and its sentinel cannot collide with a real search term`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 1);
			expect(score.bool).toBe(true);
			score.fail();
			expect(score.bool).toBe(false);
			// a user searching the literal text must not merge into the fail sentinel entry
			score.add({ term:`!FAIL!`, plus:false, minus:true }, 4);
			expect(score.terms.length).toBe(3);
			expect(score.hits).toEqual([1, 1, 4]);
		});

		test(`append() merges another score's terms into this one`, () => {
			const a = new SearchScore(mk(`X`));
			a.add(term(`a`), 1);
			const b = new SearchScore(mk(`X`));
			b.add(term(`b`), 2);
			a.append(b);
			expect(a.terms.map(t => t.term)).toEqual([`a`, `b`]);
			expect(a.hits).toEqual([1, 2]);
		});

		test(`concat() merges this score's terms with the given scores without mutating either`, () => {
			const a = new SearchScore(mk(`X`));
			a.add(term(`a`), 1);
			const b = new SearchScore(mk(`X`));
			b.add(term(`b`), 2);
			const merged = a.concat(b);
			expect(merged).not.toBe(a);
			expect(merged.searchable).toBe(a.searchable);
			expect(merged.terms.map(t => t.term)).toEqual([`a`, `b`]);
			expect(merged.hits).toEqual([1, 2]);
			expect(a.hits).toEqual([1]);
			expect(b.hits).toEqual([2]);
		});

		test(`concat() accumulates hits for terms shared between the scores`, () => {
			const a = new SearchScore(mk(`X`));
			a.add(term(`a`), 1);
			const b = new SearchScore(mk(`X`));
			b.add(term(`a`), 2);
			expect(a.concat(b).hits).toEqual([3]);
		});

		test(`concat() carries over this score's compScore`, () => {
			const a = new SearchScore(mk(`X`), 7);
			a.add(term(`a`), 1);
			expect(a.concat().compScore).toBe(7);
		});

	});

	describe("totalHits", () => {

		test(`sums all hit counts`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 2);
			score.add(term(`b`), 3);
			expect(score.totalHits).toBe(5);
		});

	});

});
