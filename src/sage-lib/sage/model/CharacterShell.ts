import { isDefined, isString, numberOrUndefined, StringSet, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { Wealth } from "../commands/trackers/wealth/Wealth.js";
import { getCharWealth } from "../commands/trackers/wealth/getCharWealth.js";
import type { CharacterManager } from "./CharacterManager.js";
import type { GameCharacter, StatResults, TGameCharacterType } from "./GameCharacter.js";
import type { TKeyValuePair } from "./SageMessageArgs.js";

export type CharacterShellCore = {
	/** id of the GameCharacter */
	gameCharacterId: string;
	/** id of the PartyCharacter */
	id: string;
	/** nickname + suffix */
	label: string;
	/** alias/nickname of the PartyCharacter */
	nickname: string;
	/**  */
	stats?: { [key:string]: string; };
	/** used when multiple PartyCharacters have the same label, A-Z */
	suffix?: string;
	/** type of the GameCharacter */
	type: TGameCharacterType;
};

export class CharacterShell {
	public constructor(public core: CharacterShellCore, public game: GameCharacter | undefined) { }

	public get companions(): CharacterManager | undefined {
		return this.game?.companions;
	}
	public get id(): string {
		return this.core.id;
	}
	public get alias(): string | undefined {
		// return this.game?.alias;
		return undefined;
	}
	public get name(): string {
		return this.core.label;
		// const { nickname, suffix } = this.party;
		// if (suffix) {
		// 	return `${nickname} ${suffix}`;
		// }
		// return nickname;
	}
	public get userId(): Snowflake | undefined {
		return this.game?.userDid;
	}

	public getNumber(key: string): number | undefined {
		return numberOrUndefined(this.getString(key));
	}

	public getString(key: string): string | undefined {
		return this.getStat(key) ?? undefined;
	}

	/** @deprecated start using getNumber or getString */
	public getStat(key: string): string | null;
	/** @deprecated start using getNumber or getString */
	public getStat(key: string, includeKey: true): StatResults<string>;
	public getStat(key: string, includeKey?: boolean): StatResults<string> | string | null {
		const keyLower = key.toLowerCase() as Lowercase<string>;

		// shortcut to easily return as the args request
		const ret = (casedKey = key, value: Optional<number | string> = null) => {
			value = isDefined(value) && !isString(value) ? String(value) : value ?? null;
			return includeKey ? { key:casedKey, keyLower, value } : value;
		};

		const { stats:shellStats } = this.core;
		if (shellStats) {
			for (const shellKey of Object.keys(shellStats)) {
				if (keyLower === shellKey.toLowerCase()) {
					const statValue = shellStats[shellKey];
					if (isDefined(statValue)) {
						return ret(shellKey, statValue);
					}
				}
			}
		}

		const { game } = this;
		if (game) {
			return game.getStat(key, includeKey as true);
		}

		return ret();
	}

	public getWealth(summaryTemplate?: string | null): Wealth {
		return getCharWealth(this, summaryTemplate);
	}

	public matches(_name: string): boolean {
		// return this.game?.matches(name) ?? false;
		return false;
	}

	public async updateStats(pairs: TKeyValuePair[], save: boolean): Promise<StringSet> {
		if (this.game && ["pc","companion"].includes(this.game.type)) {
			return this.game.updateStats(pairs, save);
		}

		const updatedKeys = new StringSet();
		const shellStats = this.core.stats ??= {};
		for (const pair of pairs) {
			const { key, value } = pair;
			const keyLower = key.toLowerCase();

			// find the shellKey every pair in case two pairs write the same key
			const shellKey = Object.keys(shellStats).find(shellKey => keyLower === shellKey.toLowerCase()) ?? key;
			if (shellStats[shellKey] !== value) {
				if (!value?.trim()) {
					delete shellStats[shellKey];
				}else {
					shellStats[shellKey] = value;
				}
				updatedKeys.add(shellKey);
			}
		}
		return updatedKeys;
	}
}