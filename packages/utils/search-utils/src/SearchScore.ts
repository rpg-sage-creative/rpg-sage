import type { Searchable } from "./Searchable.js";

export type SearchTermData = {
	term: string;
	regex: RegExp | null;
	plus: boolean;
	minus: boolean;
};

/** Returns a multiplier based on specific include (plus) and exclude (minus) terms. */
function getTermMultiplier(termData: SearchTermData): number {
	if (termData.minus) {
		return -5;
	}
	if (termData.plus) {
		return 5;
	}
	return 1;
}

/** Returns a multiplier based on if the term was included in the object's name. */
function getNameMultiplier(included: boolean): number {
	return included ? 2 : 1;
}

export class SearchScore<T extends Searchable> {
	public constructor(public searchable: T, public compScore?: number) { }

	/** All criteria has been met, no minus matches, all plus matches, any other matches */
	public get bool(): boolean {
		if (this.minusMatches < 0) {
			return false;
		}
		return this.plusMatches === 0 ? this.otherMatches > 0 : this.otherMatches > -1;
	}

	public hits: number[] = [];

	/** -1 means exists and is bad, 0 means non-existent, 1 means exists and good */
	public get minusMatches(): number {
		const indexes = this.terms.map((termData, index) => termData.minus ? index : -1).filter(i => i !== -1);
		if (!indexes.length) {
			return 0;
		}
		if (indexes.find(index => this.hits[index] > 0) !== undefined) {
			return -1;
		}
		return 1;
	}

	/** -1 means exists and is bad, 0 means non-existent, 1 means exists and good */
	public get otherMatches(): number {
		const indexes = this.terms.map((termData, index) => !termData.minus && !termData.plus ? index : -1).filter(i => i !== -1);
		if (!indexes.length) {
			return 0;
		}
		if (indexes.find(index => this.hits[index] > 0) !== undefined) {
			return 1;
		}
		return -1;
	}

	/** -1 means exists and is bad, 0 means non-existent, 1 means exists and good */
	public get plusMatches(): number {
		const indexes = this.terms.map((termData, index) => termData.plus ? index : -1).filter(i => i !== -1);
		if (!indexes.length) {
			return 0;
		}
		if (indexes.find(index => this.hits[index] === 0) !== undefined) {
			return -1;
		}
		return 1;
	}

	public terms: SearchTermData[] = [];

	public get totalScore(): number {
		let score = 0;
		const searchableName = this.searchable.name;
		this.terms.forEach((term, index) => {
			const termMultiplier = getTermMultiplier(term);
			const hitsMultiplier = this.hits[index];
			const nameMultiplier = getNameMultiplier(searchableName.includes(term.term));
			score += termMultiplier * hitsMultiplier * nameMultiplier;
		});
		return score;
	}

	public get totalHits(): number {
		return this.hits.reduce((total, current) => total + current, 0);
	}

	public add(termData: SearchTermData, hits: number): void {
		const index = this.terms.findIndex(t => t.term === termData.term);
		if (index < 0) {
			this.terms.push(termData);
			this.hits.push(hits);
		}else {
			this.hits[index] += hits;
		}
	}

	public append(...scores: SearchScore<T>[]): void {
		scores.forEach(score => score.terms.forEach((term, i) => this.add(term, score.hits[i])));
	}

	public concat(...scores: SearchScore<T>[]): SearchScore<T> {
		const newScore = new SearchScore(this.searchable);
		scores.forEach(score => score.terms.forEach((term, i) => newScore.add(term, score.hits[i])));
		return newScore;
	}

	public fail(): void {
		this.add({ term:"!FAIL!", regex:null, plus:false, minus:true }, 1);
	}
}