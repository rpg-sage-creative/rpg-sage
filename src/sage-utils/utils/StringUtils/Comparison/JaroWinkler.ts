type TValue = {
	value: string;
	length: number;
	flags: boolean[];
};

function createValue(value: string): TValue {
	const length = value?.length ?? 0;
	const flags = new Array(length).fill(false);
	return { value, length, flags };
}

type TOptions = {
	winklerThreshold: number;
	winklerMaxPrefixLength: number;
	winklerPrefixScale: number;
};

function ensureOptions(options?: TOptions): TOptions {
	return {
		winklerThreshold: options?.winklerThreshold ?? 0.7,
		winklerMaxPrefixLength: options?.winklerMaxPrefixLength ?? 4,
		winklerPrefixScale: options?.winklerPrefixScale ?? 0.1
	};
}

type TData = {
	input: [string, string];
	short: TValue;
	long: TValue;
	matchCount: number;
	hasMatches: boolean;
	transpositionCount: number;
	hasTranspositions: boolean;
	jaroSimilarity: number;
	jaroWinklerSimilarity: number;
	hasSimilarity: boolean;
	options: TOptions;
};

function createData(textOne: string, textTwo: string, options?: TOptions): TData {
	const dataOne = createValue(textOne);
	const dataTwo = createValue(textTwo);
	const [short, long] = dataOne.length < dataTwo.length ? [dataOne, dataTwo] : [dataTwo, dataOne];
	return {
		input: [textOne, textTwo],
		short: short,
		long: long,
		matchCount: 0,
		hasMatches: false,
		transpositionCount: 0,
		hasTranspositions: false,
		jaroSimilarity: 0,
		jaroWinklerSimilarity: 0,
		hasSimilarity: false,
		options: ensureOptions(options)
	};
}

/** Return true if the long value hasn't been matched yet AND it matches the short value. */
function isNewMatch(data: TData, shortIndex: number, longIndex: number): boolean {
	return data.long.flags[longIndex] === false
		&& data.short.value[shortIndex] === data.long.value[longIndex];
}

function markMatch(data: TData, shortIndex: number, longIndex: number): void {
	data.matchCount++;
	data.hasMatches = true;
	data.short.flags[shortIndex] = true;
	data.long.flags[longIndex] = true;
}

function calculateLongIndexRange(data: TData, shortIndex: number): [number, number] {
	const maxLength = Math.max(data.short.length, data.long.length);
	const range = Math.floor(maxLength / 2) - 1;
	const start  = Math.max(0, shortIndex - range);
	const limit = Math.min(data.long.length, shortIndex + range + 1);
	return [start, limit];
}

function countMatches(data: TData): void {
	// Iterate the short string
	for (let shortIndex = 0; shortIndex < data.short.length; shortIndex++) {
		// Calculate the start and limit values for the second loop
		const [start, limit] = calculateLongIndexRange(data, shortIndex);
		// Iterate the long string until we find a match
		for (let longIndex = start; longIndex < limit; longIndex++) {
			// We only mark the match if it is a new match
			if (isNewMatch(data, shortIndex, longIndex)) {
				markMatch(data, shortIndex, longIndex);
				break;
			}
		}
	}
}

function countTranspositions(data: TData): void {
	let transpositions = 0;

	let longIndex = 0;
	// Iterate the short string
	for (let shortIndex = 0; shortIndex < data.short.length; shortIndex++) {
		// If this character has a match, find the match
		if (data.short.flags[shortIndex]) {
			// Find the matching character in the long string
			// (looking for false will ensure we end the loop if we inadvertantly run longer than the long string's length)
			while (data.long.flags[longIndex] === false) {
				longIndex++;
			}
			// We only count if the matches are different characters
			if (data.short.value[shortIndex] !== data.long.value[longIndex]) {
				transpositions++;
			}
			// Ensure we don't find this same match
			longIndex++;
		}
	}

	data.transpositionCount = transpositions / 2;
	data.hasTranspositions = transpositions > 0;
}

function calculateJaroSimilarity(data: TData): void {
	const shortWeight = data.matchCount / data.short.length;
	const longWeight = data.matchCount / data.long.length;
	const transpositionWeight = (data.matchCount - data.transpositionCount) / data.matchCount;
	const weights = shortWeight + longWeight + transpositionWeight;
	const jaro = weights / 3;

	data.jaroSimilarity = jaro;
	data.hasSimilarity = jaro > 0;
}

function calculateWinklerSimilarity(data: TData): void {
	const jaro = data.jaroSimilarity;
	const options = data.options;
	if (jaro > options.winklerThreshold) {
		const prefix = Math.min(getPrefixLength(data), options.winklerMaxPrefixLength);
		const prefixWeight = options.winklerPrefixScale * prefix * (1 - jaro);
		data.jaroWinklerSimilarity = jaro + prefixWeight;
	}
}

function getPrefixLength(data: TData): number {
	let prefix = 0;
	for (let index = 0; index < data.short.length; index++) {
		if (data.short.value[index] === data.long.value[index]) {
			prefix++;
		}else {
			break;
		}
	}
	return prefix;
}

export default class JaroWinklerComparator {
	public static calculate(textOne: string, textTwo: string): TData;
	public static calculate(textOne: string, textTwo: string, options: TOptions): TData;
	public static calculate(textOne: string, textTwo: string, options?: TOptions): TData {
		const data = createData(textOne, textTwo, options);

		// if either value is empty, exit early
		if (!data.short.length || !data.long.length) {
			return data;
		}

		// if both values are the same, exit early
		if (data.short.value === data.long.value) {
			data.jaroSimilarity = 1;
			data.jaroWinklerSimilarity = 1;
			data.hasSimilarity = true;
			return data;
		}

		countMatches(data);

		if (data.hasMatches) {
			countTranspositions(data);
			//Adjust for similarities in non matches ? ? ?
			calculateJaroSimilarity(data);
			calculateWinklerSimilarity(data);
		}

		return data;
	}
	public static compare(textOne: string, textTwo: string): number {
		return JaroWinklerComparator.calculate(textOne, textTwo).jaroWinklerSimilarity;
	}
}
