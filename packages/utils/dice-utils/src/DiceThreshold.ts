/*
This is where we are going to manage ensuring an individual die roll has a minimum / maximum value.
Current working term is threshold.
Top Threshold is the HIGHEST value you can get, regardless of the rolled value.
Bottom Threshold is the LOWEST value you can get, regardless of the rolled value.
Working codes are tt and bt.
Ex: [1d8tt7] would mean that when an 8 is rolled, a value of 7 would be used.
Ex: [1d8bt2] would mean that when a 1 is rolled, a value of 2 would be used.

maybe use lt (lowest threshold) and ht (highest threshold) to match dh and dl and kh and kl (drop/keep)
*/

import type { TokenData, TokenParsers } from "./types/index.js";

export enum DiceThresholdType {
	None = 0,
	LowestThreshold = 1,
	HighestThreshold = 2
}

/** The information about how manipulate rolls to meet the threshold. */
export type DiceThresholdData = {
	/** the fundamental action */
	type: DiceThresholdType;
	/** the value used for the threshold */
	value: number;
	/** a human readable alternative for output */
	alias?: string;
};

/**
 * @internal
 */
export class DiceThreshold {
	public constructor(protected data?: DiceThresholdData) { }

	public get alias(): string { return this.data?.alias ?? ""; }
	public get isEmpty(): boolean { return !this.type || !this.value; }
	public get type(): DiceThresholdType { return this.data?.type ?? DiceThresholdType.None; }
	public get value(): number { return this.data?.value ?? 0; }

	public update(dieValues: number[]): number[] {
		return dieValues.map(value => this.shouldUpdate(value) ? this.value : value);
	}

	public shouldUpdate(value: number): boolean {
		if (!this.isEmpty) {
			switch(this.type) {
				case DiceThresholdType.HighestThreshold: return value > this.value;
				case DiceThresholdType.LowestThreshold: return value < this.value;
				case DiceThresholdType.None: return false;
			}
		}
		return false;
	}

	public toJSON() {
		return this.data;
	}

	/** Generates string output for the given DiceExplodeData */
	public toString(leftPad?: string, rightPad?: string) {
		if (this.isEmpty) {
			return ``;
		}
		if (["lt", "bt", "ht", "tt"].includes(this.alias)) {
			return `${leftPad}${this.alias} ${this.value}${rightPad}`;
		}
		return `${leftPad}(${this.alias})${rightPad}`;
	}

	/** The token key/regex used to generate ThresholdData */
	public static getParsers(): TokenParsers {
		return { threshold:/(bt|lt|ht|tt)\s*(\d+)/i };
	}

	/** Parses the given TokenData into ThresholdData */
	public static parseData(token?: TokenData | null): DiceThresholdData | undefined {
		if (token?.key === "threshold") {
			const alias = token.matches[0].toLowerCase().slice(0, 2);
			const replaced = alias.replace(/bt/, "lt").replace(/tt/, "ht");
			const type = [null, "lt", "ht"].indexOf(replaced);
			const value = +token.matches[1] || 1;
			return { alias, type, value };
		}
		return undefined;
	}

	public static from(token?: TokenData | null): DiceThreshold {
		return new DiceThreshold(DiceThreshold.parseData(token));
	}

}