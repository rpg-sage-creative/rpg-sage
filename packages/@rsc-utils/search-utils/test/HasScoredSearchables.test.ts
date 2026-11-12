import { describe, expect, test } from "vitest";
import { HasScoredSearchables, SearchScore } from "../build/index.js";

const mk = (name: string, searchResultCategory = `Cat`, code = `SRC`) => (
	{
		name,
		searchResultCategory,
		source: { code },
		toSearchResult() { return name; },
		search() { return undefined as never; },
		searchRecursive() { return []; }
	}
);

describe("HasScoredSearchables", () => {

	test(`a new instance is empty`, () => {
		const hss = new HasScoredSearchables();
		expect(hss.isEmpty).toBe(true);
		expect(hss.count).toBe(0);
		expect(hss.theOne).toBe(undefined);
	});

	test(`add() increases the count and exposes searchables`, () => {
		const hss = new HasScoredSearchables();
		hss.add(new SearchScore(mk(`Alpha`)));
		expect(hss.count).toBe(1);
		expect(hss.searchables.map(s => s.name)).toEqual([`Alpha`]);
	});

	test(`theOne returns the only score's searchable when exactly one exists`, () => {
		const hss = new HasScoredSearchables();
		const alpha = mk(`Alpha`);
		hss.add(new SearchScore(alpha));
		expect(hss.theOne).toBe(alpha);
		hss.add(new SearchScore(mk(`Beta`)));
		expect(hss.theOne).toBe(undefined);
	});

	test(`scores with the same label are not added twice`, () => {
		const hss = new HasScoredSearchables();
		hss.add(new SearchScore(mk(`Alpha`)));
		hss.add(new SearchScore(mk(`Alpha`)));
		expect(hss.count).toBe(1);
	});

	test(`scores with different categories are kept even with the same name`, () => {
		const hss = new HasScoredSearchables();
		hss.add(new SearchScore(mk(`Alpha`, `One`)));
		hss.add(new SearchScore(mk(`Alpha`, `Two`)));
		expect(hss.count).toBe(2);
	});

	test(`scores sort by compScore descending, undefined treated as 0`, () => {
		const hss = new HasScoredSearchables();
		const low = new SearchScore(mk(`Low`));
		low.compScore = 1;
		const high = new SearchScore(mk(`High`));
		high.compScore = 9;
		const none = new SearchScore(mk(`None`));
		hss.add(low, none, high);
		expect(hss.scores.map(s => s.searchable.name)).toEqual([`High`, `Low`, `None`]);
	});

	test(`scores with equal compScore sort by totalScore descending then name`, () => {
		const hss = new HasScoredSearchables();
		const weak = new SearchScore(mk(`Weak`));
		weak.add({ term:`a`, plus:false, minus:false }, 1);
		const strong = new SearchScore(mk(`Strong`));
		strong.add({ term:`a`, plus:false, minus:false }, 5);
		hss.add(weak, strong);
		expect(hss.scores.map(s => s.searchable.name)).toEqual([`Strong`, `Weak`]);
	});

	test(`add() accepts multiple scores at once and in separate calls`, () => {
		const hss = new HasScoredSearchables();
		hss.add(new SearchScore(mk(`A`)), new SearchScore(mk(`B`)));
		hss.add(new SearchScore(mk(`C`)));
		expect(hss.count).toBe(3);
	});

});
