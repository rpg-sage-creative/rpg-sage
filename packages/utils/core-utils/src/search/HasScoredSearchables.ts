import { sortPrimitive } from "../array/index.js";
import type { SearchScore } from "./SearchScore.js";
import type { Searchable } from "./Searchable.js";

function sortByCompScore<T extends Searchable>(a: SearchScore<T>, b: SearchScore<T>): number {
	return sortPrimitive(b.compScore ?? 0, a.compScore ?? 0)
		|| sortPrimitive(b.totalScore, a.totalScore)
		|| sortPrimitive(a.searchable.name, b.searchable.name);
}

function searchableToLabel<T extends Searchable>(score: SearchScore<T>): string {
	const category = score.searchable.searchResultCategory,
		source = score.searchable?.source?.code;
	if (category) {
		return `${score.searchable.toSearchResult()}${source} - ${category}`;
	}
	return `${score.searchable.toSearchResult()}${source}`;
}

export class HasScoredSearchables<T extends Searchable> {

	// #region properties

	public get count(): number {
		return this.scores.length;
	}

	public get isEmpty(): boolean {
		return !this.scores.length;
	}

	public scores: SearchScore<T>[] = [];

	public get searchables(): T[] {
		return this.scores.map(score => score.searchable);
	}

	public get theOne(): T | undefined {
		return this.scores.length === 1 ? this.scores[0].searchable : undefined;
	}

	// #endregion

	// #region methods

	public add(...scores: SearchScore<T>[]) {
		const labels = this.scores.map(score => searchableToLabel(score));
		scores.forEach(score => {
			const label = searchableToLabel(score);
			if (!labels.includes(label)) {
				this.scores.push(score);
			}
		});
		this.scores.sort(sortByCompScore);
	}

	// #endregion
}
