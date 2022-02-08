import type { SearchScore } from ".";
import { sortAscending } from "../ArrayUtils/Sort";
import type { ISearchable } from "./types";

function sortByCompScore<T extends ISearchable>(a: SearchScore<T>, b: SearchScore<T>): number {
	return sortAscending(b.compScore ?? 0, a.compScore ?? 0)
		|| sortAscending(b.totalScore, a.totalScore)
		|| sortAscending(a.searchable.name, b.searchable.name);
}

export default class HasScoredSearchables<T extends ISearchable> {

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

	public get theOne(): T | null {
		return this.scores.length === 1 ? this.scores[0].searchable : null;
	}

	// #endregion

	// #region methods

	public add(...scores: SearchScore<T>[]) {
		this.scores.push(...scores);
		this.scores.sort(sortByCompScore);
	}

	// #endregion
}
