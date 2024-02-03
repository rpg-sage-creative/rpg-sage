import type { TokenData, TokenParsers } from "./types/index.js";
import { DiceTestType } from "./DiceTest.js";
import { rollDie } from "./rollDie.js";

export type DiceExplodeData = {
	alias: string;
	/** the fundamental action */
	type: DiceTestType;
	/** the value we explode (around) */
	value: number;
};

export class DiceExplode {
	public constructor(protected data?: DiceExplodeData) { }

	public get alias(): string { return this.data?.alias ?? ""; }
	public get isEmpty(): boolean { return !this.type || !this.value; }
	public get type(): DiceTestType { return this.data?.type ?? DiceTestType.None; }
	public get value(): number { return this.data?.value ?? 0; }

	public explode(dieSize: number, dieValues: number[]): number[] {
		const explodedValues: number[] = [];
		let extra = dieValues.filter(value => this.shouldExplode(value)).length;
		while (extra > 0) {
			const rollValue = rollDie(dieSize);
			explodedValues.push(rollValue);
			if (!this.shouldExplode(rollValue)) {
				extra--;
			}
		}
		return explodedValues;
	}

	public shouldExplode(value: number): boolean {
		if (!this.isEmpty) {
			switch(this.type) {
				case DiceTestType.GreaterThan: return value > this.value;
				case DiceTestType.GreaterThanOrEqual: return value >= this.value;
				case DiceTestType.Equal: return value === this.value;
				case DiceTestType.LessThanOrEqual: return value <= this.value;
				case DiceTestType.LessThan: return value < this.value;
				case DiceTestType.None: return false;
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
		if (this.alias === "x") {
			// get the type if not simply exploding the given value.
			const test = ["", "", ">", ">=", "<", "<="][this.type];
			// put the values into an array, filter on non-empty non-zero values, join with spaces
			const output = ["x", test, this.value].filter(value => value).join(" ");
			return `${leftPad}${output}${rightPad}`;
		}
		return `${leftPad}(${this.alias})${rightPad}`;
	}

	/** The token key/regex used to generate DiceExplodeData */
	public static getParsers(): TokenParsers {
		return { explode:/((x)\s*(<=|<|>=|>|=)?\s*(\d+)?)/i };
	}

	/** Parses the given TokenData into DiceExplodeData */
	public static parseData(token: TokenData): DiceExplodeData | undefined {
		if (token.key === "explode") {
			const alias = token.matches[0].toLowerCase();
			const type = ["", "=", ">", ">=", "<", "<="].indexOf(token.matches[1] ?? "=");
			const value = +token.matches[2] || 0;
			return { alias, type, value };
		}
		return undefined;
	}

	public static from(token: TokenData): DiceExplode {
		return new DiceExplode(DiceExplode.parseData(token));
	}

	public static explode(dieSize: number, dieValues: number[]): number[] {
		const exploder = new DiceExplode({ alias:"x", type:DiceTestType.Equal, value:dieSize });
		return exploder.explode(dieSize, dieValues);
	}
}
