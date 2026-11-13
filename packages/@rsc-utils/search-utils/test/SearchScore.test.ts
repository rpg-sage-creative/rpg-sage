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

		test(`bool is false for an exclusion-only score even when no excluded term hits (other matches are required)`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`bad`, { minus:true }), 0);
			expect(score.bool).toBe(false);
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

		test(`fail() adds a minus !FAIL! term that forces bool false`, () => {
			const score = new SearchScore(mk(`X`));
			score.add(term(`a`), 1);
			expect(score.bool).toBe(true);
			score.fail();
			expect(score.bool).toBe(false);
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

		test(`known quirk: concat() merges only the given scores, not this score's own terms`, () => {
			const a = new SearchScore(mk(`X`));
			a.add(term(`a`), 1);
			const b = new SearchScore(mk(`X`));
			b.add(term(`b`), 2);
			const merged = a.concat(b);
			expect(merged).not.toBe(a);
			expect(merged.searchable).toBe(a.searchable);
			expect(merged.terms.map(t => t.term)).toEqual([`b`]);
			expect(merged.hits).toEqual([2]);
			expect(a.hits).toEqual([1]);
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
