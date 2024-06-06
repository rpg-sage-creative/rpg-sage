import { rollDataSorter } from "../internal/rollDataSorter.js";
import type { TokenData, TokenParsers } from "../internal/tokenize.js";
import type { RollData } from "../types/RollData.js";
import { DiceManipulation } from "./DiceManipulation.js";

export enum DiceDropKeepType {
	None = 0,
	DropLowest = 1,
	DropHighest = 2,
	KeepLowest = 3,
	KeepHighest = 4
}

/** The information about how many dice to drop or keep and how to display that in the output. */
export type DiceDropKeepData = {
	/** the fundamental action */
	type: DiceDropKeepType;
	/** how many dice we drop or keep */
	value: number;
	/** a human readable alternative for output */
	alias?: string;
};

/** Tests if a particular roll should be dropped. */
function shouldBeDropped(this: DiceDropKeepData, _roll: RollData, index: number, rolls: RollData[]): boolean {
	switch(this.type) {
		case DiceDropKeepType.DropHighest:
			return index >= (rolls.length - this.value);
		case DiceDropKeepType.DropLowest:
			return index < this.value;
		case DiceDropKeepType.KeepHighest:
			return index < (rolls.length - this.value);
		case DiceDropKeepType.KeepLowest:
			return index >= this.value;
		default: return false;
	}
}

export class DiceDropKeep extends DiceManipulation<DiceDropKeepData> {
	public get alias(): string { return this.data?.alias ?? ""; }
	public get type(): DiceDropKeepType { return this.data?.type ?? DiceDropKeepType.None; }
	public get value(): number { return this.data?.value ?? 0; }

	/** Marks all rolls to be dropped as such. */
	public manipulateRolls(rolls: RollData[]): void {
		if (!this.isEmpty) {
			const sorted = rolls.slice();
			sorted.sort(rollDataSorter);
			sorted.filter(shouldBeDropped, this.data).forEach(roll => {
				roll.isDropped = true;
			});
		}
	}

	/** Generates string output for the given DropKeepData */
	public toString(leftPad = "", rightPad = ""): string {
		if (this.isEmpty) {
			return ``;
		}
		if (["dl", "dh", "kl", "kh"].includes(this.alias)) {
			return `${leftPad}${this.alias}${this.value}${rightPad}`;
		}
		return `${leftPad}(${this.alias})${rightPad}`;
	}

	/** The token key/regex used to generate DropKeepData */
	public static getParsers(): TokenParsers {
		return { dropKeep:/(dl|dh|kl|kh)\s*(\d+)?/i };
	}

	/** Parses the given TokenData into DropKeepData */
	public static parseData(token?: TokenData | null): DiceDropKeepData | undefined {
		if (token?.key === "dropKeep") {
			const alias = token.matches[0].toLowerCase().slice(0, 2);
			const type = [null, "dl", "dh", "kl", "kh"].indexOf(alias);
			const value = +token.matches[1] || 1;
			return { alias, type, value };
		}
		return undefined;
	}

}