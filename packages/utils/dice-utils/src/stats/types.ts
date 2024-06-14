import type { Optional } from "@rsc-utils/core-utils";

export type StatsCharacter = {
	companions: StatsCharacterManager<StatsCharacter> | undefined;
	name: string;
	getStat(key: string): Optional<string>;
};

export type StatsCharacterManager<T extends StatsCharacter = StatsCharacter> = {
	[index: number]: T | undefined;
	findByName(name: string): T | undefined;
	findCompanion(name: string): T | undefined;
};

export type StatsEncounterManager<T extends StatsCharacter = StatsCharacter> = {
	findActiveChar(name: string): T | undefined;
};
