export type StatNumbersOptions = {
	max?: boolean;
	min?: boolean;
	tmp?: boolean;
	val?: boolean;
};

export type StatNumbersResults = {
	hasPipes?: boolean;
	isEmpty: boolean;

	max?: number;
	maxDefined?: boolean;
	maxKey?: string;
	maxPipes?: boolean;

	min?: number;
	minDefined?: boolean;
	minKey?: string;
	minPipes?: boolean;

	tmp?: number;
	tmpDefined?: boolean;
	tmpKey?: string;
	tmpPipes?: boolean;

	val?: number;
	valDefined?: boolean;
	valKey?: string;
	valPipes?: boolean;
};

export type StatsCharacter = {
	companions: StatsCharacterManager<StatsCharacter> | undefined;
	name: string;

	getKey(key: "hitPoints" | "staminaPoints"): string;

	/** Returns the stat for the given key (as a number) */
	getNumber(key: string): number | undefined;

	getNumbers(key: string, opts?: StatNumbersOptions): StatNumbersResults;

	/** @deprecated use getString or getNumber */
	getStat(key: string): string | null;

	/** Returns the stat for the given key (as meta about the stat). */
	getStat(key: string, bool: true): {
		hasPipes?: boolean;
		isDefined: boolean;
		key: string;
		keyLower: Lowercase<string>;
		unpiped?: string;
		value: string | null;
	};

	/** Returns the stat for the given key (as a string) */
	getString(key: string): string | undefined;

	/** Returns true if the value "matches" (after cleaning) the character's name, alias, or id */
	matches(value: string): boolean;
};

export type StatsCharacterManager<T extends StatsCharacter = StatsCharacter> = {
	[index: number]: T | undefined;
	findByName(name: string): T | undefined;
	findCompanion(name: string): T | undefined;
};

export type StatsEncounterManager<T extends StatsCharacter = StatsCharacter> = {
	findActiveChar(name: string): T | undefined;
};
