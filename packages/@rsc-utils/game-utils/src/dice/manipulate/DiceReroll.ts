/*
This will be like both Explode and DropKeep.
We will need to add more dice when the reroll triggers, but we will want to mark the original (as not counted) and rerolled values.
*/

import type { Optional, TokenData, TokenParsers } from "@rsc-utils/core-utils";
import { DiceTestType } from "../DiceTest.js";
import { DiceManipulation, type DiceManipulationArgs, type DiceManipulationResults } from "./DiceManipulation.js";
import { rollDataMapper } from "../internal/rollDataMapper.js";

const DiceRerollRegExp = /(rr)(?:\s*(<=|<|>=|>|=)?\s*(\d+))?/i;

type DiceRerollTokenData = TokenData<"reroll"> & { matches:[string, string | undefined, string | undefined]; };

export type DiceRerollData = {
	alias: string;
	/** the fundamental action */
	type: DiceTestType;
	/** the value we explode (around) */
	value: number;
};

export class DiceReroll extends DiceManipulation<DiceRerollData> {

	public get alias(): string { return this.data?.alias ?? ""; }
	public get type(): DiceTestType { return this.data?.type ?? DiceTestType.None; }
	public get value(): number { return this.data?.value ?? 0; }

	public manipulateRolls(args: DiceManipulationArgs): DiceManipulationResults {
		throw new Error("Not Implemented.");
		const rerolled: { index:number; original:number; rerolls:number; final:number; }[] = [];
		if (!this.isEmpty && args.notDropped.length) {
			const rollsToCheck = args.notDropped.slice();
			rollsToCheck;
			rollDataMapper;
		}
		rerolled;
		return { additionalRolls:[], fixedRollsUsed:0 };
	}

	public shouldReroll(value: number): boolean {
		if (!this.isEmpty) {
			switch(this.type) {
				case DiceTestType.GreaterThan: return value > this.value;
				// exclude 1 to avoid infinite rerolls
				case DiceTestType.GreaterThanOrEqual: return value >= this.value && this.value !== 1;
				case DiceTestType.Equal: return value === this.value;
				// exclude MAX to avoid infinite explosion
				/** @todo get and test MAX */
				case DiceTestType.LessThanOrEqual: return value <= this.value;
				case DiceTestType.LessThan: return value < this.value;
				case DiceTestType.None: return false;
			}
		}
		return false;
	}

	/** Generates string output for the given DiceRerollData */
	public toString(leftPad = "", rightPad = "") {
		if (this.isEmpty) {
			return ``;
		}
		if (this.alias === "rr") {
			// get the type if not simply exploding the given value.
			const test = ["", "", ">", ">=", "<", "<="][this.type];
			// put the values into an array, filter on non-empty non-zero values, join with spaces
			const output = ["rr", test, this.value].filter(value => value).join("");
			return `${leftPad}${output}${rightPad}`;
		}
		return `${leftPad}(${this.alias})${rightPad}`;
	}

	/** The token key/regex used to generate DiceExplodeData */
	public static getParsers(): TokenParsers {
		return { reroll:DiceRerollRegExp };
	}

	/** Parses the given TokenData into DiceExplodeData */
	public static parseData(token: Optional<TokenData | DiceRerollTokenData>, dieSize?: number): DiceRerollData | undefined {
		if (token?.key === "reroll") {
			const alias = token.matches[0].toLowerCase();
			const type = ["", "=", ">", ">=", "<", "<="].indexOf(token.matches[1] ?? "=");
			const value = +(token.matches[2] ?? dieSize ?? 0);
			return { alias, type, value };
		}
		return undefined;
	}

	/** Returns all values added by rerolling the given values. */
	// public static reroll(dieSize: number, dieValues: number[]): number[] {
	// 	const reroller = new DiceReroll({ alias:"rr", type:DiceTestType.Equal, value:dieSize });
	// 	const allRolls = dieValues.map((roll, index) => rollDataMapper(roll, index, dieSize, false));
	// 	const { additionalRolls } = reroller.manipulateRolls({ allRolls, notDropped:allRolls, unusedFixedRolls:[] });
	// 	return additionalRolls.map(rerolled => rerolled.value);
	// }
}