import { DiceTestType } from "../DiceTest.js";
import { rollDataMapper } from "../internal/rollDataMapper.js";
import type { TokenData, TokenParsers } from "../internal/tokenize.js";
import { rollDie } from "../roll/rollDie.js";
import type { RollData } from "../types/RollData.js";
import { DiceManipulation } from "./DiceManipulation.js";

export type DiceExplodeData = {
	alias: string;
	/** the fundamental action */
	type: DiceTestType;
	/** the value we explode (around) */
	value: number;
};

export class DiceExplode extends DiceManipulation<DiceExplodeData> {

	public get alias(): string { return this.data?.alias ?? ""; }
	public get type(): DiceTestType { return this.data?.type ?? DiceTestType.None; }
	public get value(): number { return this.data?.value ?? 0; }

	public manipulateRolls(rolls: RollData[]): RollData[] {
		const explosionRolls: RollData[] = [];
		if (!this.isEmpty) {
			const rollsToCheck = rolls.slice();
			while (rollsToCheck.length) {
				const rollToCheck = rollsToCheck.shift()!;
				/** @todo decide if i want to explode values more than once if explode syntax found more than once. */
				if (this.shouldExplode(rollToCheck.threshold ?? rollToCheck.value)) {
					rollToCheck.isExploded = true;
					const explosionValue = rollDie(rollToCheck.dieSize);
					const explosionIndex = rolls.length + explosionRolls.length;
					const explosionRoll = rollDataMapper(explosionValue, explosionIndex, rollToCheck.dieSize, false);
					explosionRoll.isExplosion = true;
					explosionRolls.push(explosionRoll);
					rollsToCheck.push(explosionRoll);
				}
			}
		}
		return explosionRolls;
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

	/** Generates string output for the given DiceExplodeData */
	public toString(leftPad = "", rightPad = "") {
		if (this.isEmpty) {
			return ``;
		}
		if (this.alias === "x") {
			// get the type if not simply exploding the given value.
			const test = ["", "", ">", ">=", "<", "<="][this.type];
			// put the values into an array, filter on non-empty non-zero values, join with spaces
			const output = ["x", test, this.value].filter(value => value).join("");
			return `${leftPad}${output}${rightPad}`;
		}
		return `${leftPad}(${this.alias})${rightPad}`;
	}

	/** The token key/regex used to generate DiceExplodeData */
	public static getParsers(): TokenParsers {
		return { explode:/(x)(?:\s*(<=|<|>=|>|=)?\s*(\d+))?/i };
	}

	/** Parses the given TokenData into DiceExplodeData */
	public static parseData(token: TokenData, dieSize?: number): DiceExplodeData | undefined {
		if (token.key === "explode") {
			const alias = token.matches[0].toLowerCase();
			const type = ["", "=", ">", ">=", "<", "<="].indexOf(token.matches[1] ?? "=");
			const value = +(token.matches[2] ?? dieSize ?? 0);
			return { alias, type, value };
		}
		return undefined;
	}

	public static explode(dieSize: number, dieValues: number[]): number[] {
		const exploder = new DiceExplode({ alias:"x", type:DiceTestType.Equal, value:dieSize });
		const rollData = dieValues.map((roll, index) => rollDataMapper(roll, index, dieSize, false));
		const explodedData = exploder.manipulateRolls(rollData);
		return explodedData.map(exploded => exploded.value);
	}
}
