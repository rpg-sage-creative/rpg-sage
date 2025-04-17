import { sortPrimitive } from "../array/index.js";
import type { Searchable } from "./Searchable.js";

type TCategorizedSearchables<T extends Searchable> = {
	children: TCategorizedSearchables<T>[];
	label: string;
	searchables: T[];
};

function partitionCategorizedSearchables<T extends Searchable>(searchables: T[], categoryParser: (searchable: T) => string): TCategorizedSearchables<T>[] {
	const categorized = searchables.reduce((array, searchable) => {
		const searchableCategory = categoryParser(searchable);
		let category = array.find(cat => cat.label === searchableCategory);
		if (!category) {
			category = { label:searchableCategory, searchables:[], children:[] };
			array.push(category);
		}
		category.searchables.push(searchable);
		return array;
	}, <TCategorizedSearchables<T>[]>[]);
	categorized.forEach(category => {
		category.searchables.sort(sortByName);
		return category.searchables;
	});
	return categorized;
}

function sortByLabel<T extends Searchable>(a: TCategorizedSearchables<T>, b: TCategorizedSearchables<T>): number {
	return sortPrimitive(a.label, b.label);
}

function sortByName<T extends Searchable>(a: T, b: T): number {
	return sortPrimitive(a.name, b.name);
}

function sortByCountThenLabel<T extends Searchable>(a: TCategorizedSearchables<T>, b: TCategorizedSearchables<T>): number {
	return sortPrimitive(b.searchables.length, a.searchables.length)
		|| sortPrimitive(a.label, b.label);
}

export class HasCategorizedSearchables<T extends Searchable> {

	protected _unsortedSearchables: T[] = [];

	// #region properties

	private _categories?: string[];
	public get categories(): string[] {
		return this._categories ?? (this._categories = this.categorizedSearchables.map(cat => cat.label));
	}

	private _categorizedSearchables?: TCategorizedSearchables<T>[];
	public get categorizedSearchables(): TCategorizedSearchables<T>[] {
		if (!this._categorizedSearchables) {
			this._categorizedSearchables = partitionCategorizedSearchables(this._unsortedSearchables, searchable => searchable.searchResultCategory);
			this._categorizedSearchables.sort(sortByCountThenLabel);
			this._categorizedSearchables.forEach(category => {
				category.children = partitionCategorizedSearchables(category.searchables, searchable => searchable.name[0]);
				category.children.sort(sortByLabel);
			});
		}
		return this._categorizedSearchables;
	}

	public get categoryCount() {
		return this.categories.length;
	}

	public get isEmpty() {
		return !this._unsortedSearchables.length;
	}

	private _searchables?: T[];
	public get searchables(): T[] {
		return this._searchables ?? (this._searchables = this.categorizedSearchables.reduce((array, category) => array.concat(category.searchables), <T[]>[]));
	}

	public get searchableCount(): number {
		return this._unsortedSearchables.length;
	}

	public get theOne(): T | undefined {
		return this._unsortedSearchables.length === 1 ? this._unsortedSearchables[0] : undefined;
	}

	// #endregion

	// #region methods

	public add(...searchables: T[]) {
		this._unsortedSearchables.push(...searchables);
		delete this._searchables;
		delete this._categorizedSearchables;
		delete this._categories;
	}

	// #endregion
}
