import type { Searchable } from "./Searchable.js";

export type SearchTermData = {
	term: string;
	regex?: RegExp;
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
		// any excluded (minus) terms have hits = failure
		// any required (plus) terms don't have hits = failure
		if (this.minusMatches < 0 || this.plusMatches < 0) {
			return false;
		}

		// if no required (plus) terms exist, other terms must have hits;
		// an exclusion-only score has no positive signal and never matches by design
		if (this.plusMatches === 0) {
			return this.otherMatches > 0;
		}

		// we have required (plus) term hits, make sure other matches aren't negative
		return this.otherMatches > -1;
	}

	public hits: number[] = [];

	/**
	 * Do excluded (minus) terms have hits?
	 * -1 means excluded terms exist and do have hits (bad)
	 *  0 means excluded terms don't exist
	 *  1 means excluded terms exist and don't have hits (good)
	 */
	public get minusMatches(): -1 | 0 | 1 {
		const indexes = this.terms
			// set non-minus terms to -1
			.map((termData, index) => termData.minus ? index : -1)
			// exclude non-minus indexes
			.filter(i => i !== -1);

		// excluded terms don't exist
		if (!indexes.length) {
			return 0;
		}

		// excluded terms exist and do have hit (bad)
		if (indexes.some(index => this.hits[index]! > 0)) {
			return -1;
		}

		// excluded terms exist and don't have hit (good)
		return 1;
	}

	/** -1 means exists and is bad, 0 means non-existent, 1 means exists and good */
	/**
	 * Do other (non-minus, non-plus) terms have hits?
	 * -1 means other terms exist and don't have hits (bad)
	 *  0 means other terms don't exist
	 *  1 means other terms exist and do have hits (good)
	 */
	public get otherMatches(): -1 | 0 | 1 {
		const indexes = this.terms
			// set minusMatches and plusMatches to -1
			.map((termData, index) => termData.minus || termData.plus ? -1 : index)
			// exclude minusMatches and plusMatches
			.filter(i => i !== -1);

		// other terms don't exist
		if (!indexes.length) {
			return 0;
		}

		// other terms exist and do have hits (good)
		if (indexes.some(index => this.hits[index]! > 0)) {
			return 1;
		}

		// other terms exist and don't have hits (bad)
		return -1;
	}

	/**
	 * Do required (plus) terms have hits?
	 * -1 means required terms exist and don't have hits (bad)
	 *  0 means required terms don't exist
	 *  1 means required terms exist and do have hits (good)
	 */
	public get plusMatches(): -1 | 0 | 1 {
		const indexes = this.terms
			.map((termData, index) => termData.plus ? index : -1)
			.filter(i => i !== -1);

		// required terms don't exist
		if (!indexes.length) {
			return 0;
		}

		// required terms exist and don't have hit (bad)
		if (indexes.some(index => this.hits[index] === 0)) {
			return -1;
		}

		// required terms exist and do have hit (good)
		return 1;
	}

	public terms: SearchTermData[] = [];

	public get totalScore(): number {
		let score = 0;
		// matching is case-insensitive (terms use /gi regexes), so the name bonus must compare lowercased values
		const searchableName = this.searchable.name.toLowerCase();
		this.terms.forEach((term, index) => {
			const termMultiplier = getTermMultiplier(term);
			const hitsMultiplier = this.hits[index]!;
			const nameMultiplier = getNameMultiplier(searchableName.includes(term.term.toLowerCase()));
			score += termMultiplier * hitsMultiplier * nameMultiplier;
		});
		return score;
	}

	public get totalHits(): number {
		return this.hits.reduce((total, current) => total + current, 0);
	}

	/** Adds the term data and hits, accumulating hits when the same term (with the same plus/minus flags) already exists. */
	public add(termData: SearchTermData, hits: number): void {
		// terms must match on their flags as well; "+fire" and "fire" are different criteria
		const index = this.terms.findIndex(t => t.term === termData.term && t.plus === termData.plus && t.minus === termData.minus);
		if (index < 0) {
			this.terms.push(termData);
			this.hits.push(hits);
		}else {
			this.hits[index]! += hits;
		}
	}

	public append(...scores: SearchScore<T>[]): void {
		scores.forEach(score => score.terms.forEach((term, i) => this.add(term, score.hits[i]!)));
	}

	/** Returns a new score for this searchable that merges the terms of this score with the given scores. */
	public concat(...scores: SearchScore<T>[]): SearchScore<T> {
		// carry over compScore so merged scores keep their rank signal in HasScoredSearchables sorting
		const newScore = new SearchScore(this.searchable, this.compScore);
		[this, ...scores].forEach(score => score.terms.forEach((term, i) => newScore.add(term, score.hits[i]!)));
		return newScore;
	}

	public fail(): void {
		// the sentinel term contains whitespace so it can never be produced by tokenizing user input,
		// which keeps a real search for "!FAIL!" from colliding with this entry
		this.add({ term:"! FAIL !", regex:undefined, plus:false, minus:true }, 1);
	}
}