import XRegExp from "xregexp";
import type { Wealth } from "../commands/trackers/wealth/Wealth.js";
import { getCharWealth } from "../commands/trackers/wealth/getCharWealth.js";
import type { CharacterManager } from "./CharacterManager.js";
import type { GameCharacter, TGameCharacterType } from "./GameCharacter.js";
import type { TKeyValuePair } from "./SageMessageArgs.js";
import type { Snowflake } from "@rsc-utils/core-utils";

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

	public getStat(key: string): string | null | undefined {
		const partyStats = this.core.stats;
		if (partyStats) {
			const keyRegex = new RegExp(`^${XRegExp.escape(key)}$`, "i");
			const statKey = Object.keys(partyStats).find(pKey => keyRegex.test(pKey));
			if (statKey) {
				const statValue = partyStats[statKey] ?? null;
				if (statValue !== null) {
					return statValue;
				}
			}
		}
		return this.game?.getStat(key) ?? null;
	}

	public getWealth(summaryTemplate?: string | null): Wealth {
		return getCharWealth(this, summaryTemplate);
	}

	public async updateStats(pairs: TKeyValuePair[], save: boolean): Promise<boolean> {
		if (this.game && ["pc","companion"].includes(this.game.type)) {
			return this.game.updateStats(pairs, save);
		}
		let changes = false;
		const partyStats = this.core.stats ?? (this.core.stats = {});
		for (const pair of pairs) {
			const { key, value } = pair;
			const keyRegex = new RegExp(`^${XRegExp.escape(key)}$`, "i");
			const statKey = Object.keys(partyStats).find(pKey => keyRegex.test(pKey)) ?? key;
			if (partyStats[statKey] !== value) {
				if (!value?.trim()) {
					delete partyStats[statKey];
				}else {
					partyStats[statKey] = value;
				}
				changes = true;
			}
		}
		return changes;
	}
}