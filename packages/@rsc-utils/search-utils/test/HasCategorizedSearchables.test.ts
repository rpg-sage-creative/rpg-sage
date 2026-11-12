import { describe, expect, test } from "vitest";
import { HasCategorizedSearchables } from "../build/index.js";

const mk = (name: string, searchResultCategory: string) => (
	{
		name,
		searchResultCategory,
		source: { code:`SRC` },
		toSearchResult() { return name; },
		search() { return undefined as never; },
		searchRecursive() { return []; }
	}
);

describe("HasCategorizedSearchables", () => {

	test(`a new instance is empty`, () => {
		const hcs = new HasCategorizedSearchables();
		expect(hcs.isEmpty).toBe(true);
		expect(hcs.searchableCount).toBe(0);
		expect(hcs.categoryCount).toBe(0);
		expect(hcs.theOne).toBe(undefined);
	});

	test(`add() increases the searchable count and clears emptiness`, () => {
		const hcs = new HasCategorizedSearchables();
		hcs.add(mk(`apple`, `Fruit`));
		expect(hcs.isEmpty).toBe(false);
		expect(hcs.searchableCount).toBe(1);
	});

	test(`categories are ordered by searchable count, then label`, () => {
		const hcs = new HasCategorizedSearchables();
		hcs.add(mk(`apple`, `Fruit`), mk(`apricot`, `Fruit`), mk(`broccoli`, `Veg`));
		expect(hcs.categories).toEqual([`Fruit`, `Veg`]);
	});

	test(`searchables are flattened by category and sorted by name within a category`, () => {
		const hcs = new HasCategorizedSearchables();
		hcs.add(mk(`Zucchini`, `Veg`), mk(`broccoli`, `Veg`), mk(`apricot`, `Fruit`), mk(`apple`, `Fruit`));
		expect(hcs.searchables.map(s => s.name)).toEqual([`apple`, `apricot`, `broccoli`, `Zucchini`]);
	});

	test(`children partition a category by the first letter of each name`, () => {
		const hcs = new HasCategorizedSearchables();
		hcs.add(mk(`apple`, `Fruit`), mk(`apricot`, `Fruit`), mk(`cherry`, `Fruit`));
		const fruit = hcs.categorizedSearchables.find(c => c.label === `Fruit`)!;
		expect(fruit.children.map(c => ({ label:c.label, count:c.searchables.length }))).toEqual([
			{ label:`a`, count:2 },
			{ label:`c`, count:1 },
		]);
	});

	test(`theOne returns the only searchable when exactly one exists`, () => {
		const hcs = new HasCategorizedSearchables();
		hcs.add(mk(`solo`, `Only`));
		expect(hcs.theOne?.name).toBe(`solo`);
		hcs.add(mk(`second`, `Only`));
		expect(hcs.theOne).toBe(undefined);
	});

	test(`add() invalidates cached categories and searchables`, () => {
		const hcs = new HasCategorizedSearchables();
		hcs.add(mk(`apple`, `Fruit`));
		expect(hcs.categories).toEqual([`Fruit`]);
		hcs.add(mk(`broccoli`, `Veg`));
		expect(hcs.categories).toEqual([`Fruit`, `Veg`]);
		expect(hcs.searchables.length).toBe(2);
	});

	test(`add() accepts multiple searchables at once and in separate calls`, () => {
		const hcs = new HasCategorizedSearchables();
		hcs.add(mk(`a`, `X`), mk(`b`, `X`));
		hcs.add(mk(`c`, `Y`));
		expect(hcs.searchableCount).toBe(3);
	});

});
