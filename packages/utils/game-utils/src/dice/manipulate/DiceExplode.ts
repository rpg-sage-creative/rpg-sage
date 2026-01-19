import type { Optional, TokenData, TokenParsers } from "@rsc-utils/core-utils";
import { DiceTestType } from "../DiceTest.js";
import { rollDataMapper } from "../internal/rollDataMapper.js";
import { rollDie } from "../roll/rollDie.js";
import type { RollData } from "../types/RollData.js";
import { DiceManipulation, type DiceManipulationArgs, type DiceManipulationResults } from "./DiceManipulation.js";

const DiceExplodeRegExp = /(x)(?:\s*(<=|<|>=|>|=)?\s*(\d+))?/i;

type DiceExplodeTokenData = TokenData<"explode"> & { matches:[string, string | undefined, string | undefined]; };

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

	public manipulateRolls(args: DiceManipulationArgs): DiceManipulationResults {
		const additionalRolls: RollData[] = [];
		let fixedRollsUsed = 0;
		if (!this.isEmpty && args.notDropped.length) {
			// slice unusedFixedRolls so we can shift them as needed
			const fixedRolls = args.unusedFixedRolls.slice();
			// slice rolls and keep checking until we have popped them all (including new rolls added)
			const rollsToCheck = args.notDropped.slice();
			while (rollsToCheck.length) {
				const rollToCheck = rollsToCheck.shift()!;
				/** @todo decide if i want to explode values more than once if explode syntax found more than once. */
				if (this.shouldExplode(rollToCheck.threshold ?? rollToCheck.value)) {
					// mark the base roll as exploded
					rollToCheck.isExploded = true;
					// see if we have a fixed roll to use
					const isFixed = fixedRolls.length > 0;
					// grab fixed or roll a new one
					const explosionValue = isFixed ? fixedRolls.shift()! : rollDie(rollToCheck.dieSize);
					// get the index by combining lengths of the all rolls and additional rolls
					const explosionIndex = args.allRolls.length + additionalRolls.length;
					// map the data roll
					const explosionRoll = rollDataMapper(explosionValue, explosionIndex, rollToCheck.dieSize, isFixed);
					// mark the new roll as an explosion
					explosionRoll.isExplosion = true;
					// push the new roll to output
					additionalRolls.push(explosionRoll);
					// push the new roll to be checked
					rollsToCheck.push(explosionRoll);
					// increment the fixedRollsUsed counter
					fixedRollsUsed += isFixed ? 1 : 0;
				}
			}
		}
		return { additionalRolls, fixedRollsUsed };
	}

	public shouldExplode(value: number): boolean {
		if (!this.isEmpty) {
			switch(this.type) {
				case DiceTestType.GreaterThan: return value > this.value;
				case DiceTestType.GreaterThanOrEqual: return value >= this.value && this.value !== 1;
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
		return { explode:DiceExplodeRegExp };
	}

	/** Parses the given TokenData into DiceExplodeData */
	public static parseData(token: Optional<TokenData | DiceExplodeTokenData>, dieSize?: number): DiceExplodeData | undefined {
		if (token?.key === "explode") {
			const alias = token.matches[0].toLowerCase();
			const type = ["", "=", ">", ">=", "<", "<="].indexOf(token.matches[1] ?? "=");
			const value = +(token.matches[2] ?? dieSize ?? 0);
			return { alias, type, value };
		}
		return undefined;
	}

	/** Returns all values added by exploding the given values. */
	public static explode(dieSize: number, dieValues: number[]): number[] {
		const exploder = new DiceExplode({ alias:"x", type:DiceTestType.Equal, value:dieSize });
		const allRolls = dieValues.map((roll, index) => rollDataMapper(roll, index, dieSize, false));
		const { additionalRolls } = exploder.manipulateRolls({ allRolls, notDropped:allRolls, unusedFixedRolls:[] });
		return additionalRolls.map(exploded => exploded.value);
	}
}
