
export type StatsCharacter = {
	companions: StatsCharacterManager<StatsCharacter> | undefined;
	name: string;

	/** @deprecated use getString or getNumber */
	getStat(key: string): string | null;

	/** Returns the stat for the given key (as meta about the stat). */
	getStat(key: string, bool: true): {
		isDefined: boolean;
		key: string;
		keyLower: Lowercase<string>;
		value: string | null;
	};

	/** Returns the stat for the given key (as a string) */
	getString(key: string): string | undefined;

	/** Returns the stat for the given key (as a number) */
	getNumber(key: string): number | undefined;

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
