import type { TSortResult } from "../../types";
import JaroWinklerComparator from "./JaroWinkler";
import LevenshteinComparator from "./Levenshtein";
import SimpleTriGramComparator from "./Trigram";
import type { TComparisonResult } from "./types";

export {
	JaroWinklerComparator,
	LevenshteinComparator,
	SimpleTriGramComparator,

	TComparisonResult,
	compare,
	rank//,
	// sort
};

/** Compares the two strings using all three Comparison options and returns the results. */
function compare(a: string, b: string): TComparisonResult {
	const jar = JaroWinklerComparator.compare(a, b);
	const lev = LevenshteinComparator.compare(a, b);
	const tri = SimpleTriGramComparator.compare(a, b);
	return {
		one: a,
		two: b,
		jar: jar,
		lev: lev,
		tri: tri
	};
}

function forceIncludeJar<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return options.jar === true && !!result.jar && result.jar >= maxScores.jar - (options.includeThreshold ?? 0);
}

function forceIncludeLev<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return options.lev === true && !!result.lev && result.lev >= maxScores.lev - (options.includeThreshold ?? 0);
}

function forceIncludeTri<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return options.tri === true && !!result.tri && result.tri >= maxScores.tri - (options.includeThreshold ?? 0);
}

function forceInclude<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return forceIncludeJar(result, maxScores, options)
		|| forceIncludeLev(result, maxScores, options)
		|| forceIncludeTri(result, maxScores, options);
}

function forceExcludeJar<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return options.jar === true && (!result.jar || result.jar < maxScores.jar - (options.includeThreshold ?? 0));
}

function forceExcludeLev<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return options.lev === true && (!result.lev || result.lev < maxScores.lev - (options.includeThreshold ?? 0));
}

function forceExcludeTri<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return options.tri === true && (!result.tri || result.tri < maxScores.tri - (options.includeThreshold ?? 0));
}

function forceExclude<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	return forceExcludeJar(result, maxScores, options)
		|| forceExcludeLev(result, maxScores, options)
		|| forceExcludeTri(result, maxScores, options);
}

function filterResult<T>(result: TRankComparison<T>, maxScores: TMaxScores, options: TRankOptions<T>): boolean {
	if (options.includeThreshold) {
		if (forceInclude(result, maxScores, options)) {
			return true;
		}
		if (!options.excludeThreshold) {
			return false;
		}
	}
	if (options.excludeThreshold) {
		if (forceExclude(result, maxScores, options)) {
			return false;
		}
		if (!options.includeThreshold) {
			return true;
		}
	}
	return true;
}

function sortNumbers(a: number, b: number): TSortResult {
	if (a === b) {
		return 0;
	}
	return a < b ? 1 : -1;
}
function sortResults<T>(a: TRankComparison<T>, b: TRankComparison<T>): number {
	const sum = sortNumbers(a.jar, b.jar)
		+ sortNumbers(a.lev, b.lev)
		+ sortNumbers(a.tri, b.tri);
	if (sum === 0) {
		return 0;
	}
	return sum < 0 ? -1 : 1;
}

type TToString<T> = (item: T) => string;

type TRankComparison<T> = {
	item: T;
	jar: number;
	lev: number;
	tri: number;
};

type TRankOptions<T> = {
	ignoreCase?: boolean;
	includeThreshold?: number;
	jar?: boolean;
	excludeThreshold?: number;
	lev?: boolean;
	limit?: number;
	toString: TToString<T>;
	tri?: boolean;
};

type TMaxScores = {
	jar: number;
	lev: number;
	tri: number;
};

function cleanOptions<T>(options: TRankOptions<T>): TRankOptions<T> {
	const doAll = !options.jar && !options.lev && !options.tri;
	return {
		excludeThreshold: options.excludeThreshold,
		ignoreCase: options.ignoreCase,
		includeThreshold: options.includeThreshold,
		jar: options.jar || doAll,
		lev: options.lev || doAll,
		limit: options.limit,
		toString: options.toString || String,
		tri: options.tri || doAll
	};
}

/** Compares the items to the given text, using the given options, and returns the sorted results. */
function rank<T>(items: T[], text: string, options: TRankOptions<T> = { }): TRankComparison<T>[] {
	const _options: TRankOptions<T> = cleanOptions(options);
	const maxScores = { jar:0, lev:0, tri:0 };

	if (_options.ignoreCase) {
		text = text.toLowerCase();
	}

	// We are handling the .ignoreCase ourselves, so we don't need SimpleTriGramComparator to know
	const triGramComparator: SimpleTriGramComparator = new SimpleTriGramComparator(text);

	let results = items.map<TRankComparison<T>>(item => {
		const result = { item:item, jar:0, lev:0, tri:0 };
		let itemText = _options.toString(item);

		if (_options.ignoreCase) {
			itemText = itemText.toLowerCase();
		}

		if (_options.jar) {
			result.jar = JaroWinklerComparator.compare(text, itemText);
			maxScores.jar = Math.max(maxScores.jar, result.jar);
		}

		if (_options.lev) {
			result.lev = LevenshteinComparator.compare(text, itemText);
			maxScores.lev = Math.max(maxScores.lev, result.lev);
		}

		if (_options.tri) {
			result.tri = triGramComparator.compare(itemText);
			maxScores.tri = Math.max(maxScores.tri, result.tri);
		}

		return result;
	});


	if (_options.includeThreshold || _options.excludeThreshold) {
		results = results.filter(result => filterResult(result, maxScores, _options));
	}

	results.sort(sortResults);

	if (_options.limit) {
		results = results.slice(0, _options.limit);
	}

	/**
	// debug(`${text}: maxLev (${maxScores.lev}), maxTri (${maxScores.tri}), maxJar (${maxScores.jar})`);
	// results.forEach(result => {
	// 	debug(`\t${_options.toString(result.item)}: lev ${result.lev}, tri ${JSON.stringify(result.tri)}, jar ${result.jar}`);
	// });
	*/

	return results;
}

/**
// function sort<T>(items: T[], text: string, options: TRankOptions<T> = { }): TRankComparison<T>[] {
// 	return rank(items, text, options).map(item => item);
// }
*/