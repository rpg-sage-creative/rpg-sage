
export type StatsCharacter = {
	companions: StatsCharacterManager<StatsCharacter> | undefined;
	name: string;
	/** @deprecated use getString or getNumber */
	getStat(key: string): string | null;
	getString(key: string): string | undefined;
	getNumber(key: string): number | undefined;
};

export type StatsCharacterManager<T extends StatsCharacter = StatsCharacter> = {
	[index: number]: T | undefined;
	findByName(name: string): T | undefined;
	findCompanion(name: string): T | undefined;
};

export type StatsEncounterManager<T extends StatsCharacter = StatsCharacter> = {
	findActiveChar(name: string): T | undefined;
};
