import type { TokenData, TokenParsers } from "./types/index.js";
import { strike } from "./markup.js";
import { sum } from "./sum.js";
import { RollIndexOutput } from "./types/RollIndexOutput.js";

function sortNumbers(a: number, b: number): -1 | 0 | 1 {
	if (a < b) {
		return -1;
	}else if (a > b) {
		return 1;
	}
	return 0;
}

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
function isDropped(this: DiceDropKeepData, _roll: RollIndexOutput, index: number, rolls: RollIndexOutput[]): boolean {
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

export class DiceDropKeep {
	public constructor(protected data?: DiceDropKeepData) { }

	public get alias(): string { return this.data?.alias ?? ""; }
	public get isEmpty(): boolean { return !this.type || !this.value; }
	public get type(): DiceDropKeepType { return this.data?.type ?? DiceDropKeepType.None; }
	public get value(): number { return this.data?.value ?? 0; }

	/** Adjusts the count by removing any dice that were dropped. */
	public adjustCount(count: number): number {
		if (!this.isEmpty) {
			switch(this.type) {
				case DiceDropKeepType.DropHighest:
				case DiceDropKeepType.DropLowest:
					return count - this.value;
				case DiceDropKeepType.KeepHighest:
				case DiceDropKeepType.KeepLowest:
					return this.value;
			}
		}
		return count;
	}

	/** Modifies all dropped rolls' outputs to be ~striked~ (struck). */
	public strikeDropped(rolls: RollIndexOutput[]): void {
		if (!this.isEmpty) {
			DiceDropKeep.sort(rolls)
				.filter(isDropped, this.data)
				.forEach(roll => roll.output = strike(roll.output));
		}
	}

	/** Adjusts the sum by removing any dice that were dropped. */
	public adjustSum(values: number[]): number {
		if (!this.isEmpty) {
			const sorted = values.slice().sort(sortNumbers);
			switch (this.type) {
				case DiceDropKeepType.DropHighest:
					return sum(sorted.slice(0, -this.value));
				case DiceDropKeepType.DropLowest:
					return sum(sorted.slice(this.value));
				case DiceDropKeepType.KeepHighest:
					return sum(sorted.slice(-this.value));
				case DiceDropKeepType.KeepLowest:
					return sum(sorted.slice(0, this.value));
			}
			console.warn(`Invalid dropKeep.type = ${this.type} (${DiceDropKeepType[this.type]})`);
		}
		return sum(values);
	}

	public toJSON() {
		return this.data;
	}

	/** Generates string output for the given DropKeepData */
	public toString(leftPad = "", rightPad = ""): string {
		if (this.isEmpty) {
			return ``;
		}
		if (["dl", "dh", "kl", "kh"].includes(this.alias)) {
			return `${leftPad}${this.alias} ${this.value}${rightPad}`;
		}
		return `${leftPad}(${this.alias})${rightPad}`;
	}

	/** The token key/regex used to generate DropKeepData */
	public static getParsers(): TokenParsers {
		return { dropKeep:/(dl|dh|kl|kh)\s*(\d+)?/i };
	}

	/** Parses the given TokenData into DropKeepData */
	public static parse(token?: TokenData | null): DiceDropKeepData | undefined {
		if (token?.key === "dropKeep") {
			const alias = token.matches[0].toLowerCase().slice(0, 2);
			const type = [null, "dl", "dh", "kl", "kh"].indexOf(alias);
			const value = +token.matches[1] || 1;
			return { alias, type, value };
		}
		return undefined;
	}

	/** Sorts the rolls so that the correct values can be ~striked~ (struck?). */
	public static sort(rolls: RollIndexOutput[]): RollIndexOutput[] {
		const sorted = rolls.slice();
		sorted.sort((a, b) => {
			// sort lowest to highest first
			const byRoll = sortNumbers(a.roll, b.roll);
			if (byRoll !== 0) {
				return byRoll;
			}
			// The second sort of .index ensures that the first of two equal rolls is on the left so that we properly strike them in order.
			return sortNumbers(a.index, b.index);
		});
		return sorted;
	}
}