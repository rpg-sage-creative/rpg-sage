import { TokenData, TokenParsers } from "../../sage-utils/StringUtils";
import { TDiceRoll } from "../base";

export enum DiceTestType {
	None = 0,
	Equal = 1,
	GreaterThan = 2,
	GreaterThanOrEqual = 3,
	LessThan = 4,
	LessThanOrEqual = 5
}

/** @deprecated use DiceTestType */
export const TestType = DiceTestType;

/** The information about how to test dice results for success/failure and how to display that in the output. */
export type DiceTestData = {
	/** a human readable alternative output */
	alias?: string;
	/** the fundamental test */
	type: DiceTestType;
	/** the value to test against */
	value: number;
};

/** Finds the DiceTestType for the given matched value from the RegExp */
function parseDiceTestType(matchValue: string): DiceTestType {
	const testType = matchValue.replace(/=+/g, "=").toLowerCase();
	if (["eq", "="].includes(testType)) {
		return DiceTestType.Equal;
	}
	if (["gt", ">"].includes(testType)) {
		return DiceTestType.GreaterThan;
	}
	if (["lt", "<"].includes(testType)) {
		return DiceTestType.LessThan;
	}
	if (["gteq", "gte", ">="].includes(testType)) {
		return DiceTestType.GreaterThanOrEqual;
	}
	if (["lteq", "lte", "<="].includes(testType)) {
		return DiceTestType.LessThanOrEqual;
	}
	return DiceTestType.None;
}

export class DiceTest {
	public constructor(protected core?: DiceTestData) { }

	public get alias(): string { return this.core?.alias ?? ""; }
	public get isEmpty(): boolean { return !this.core?.type || isNaN(this.core.value); }
	public get type(): DiceTestType { return this.core?.type ?? DiceTestType.None; }
	public get value(): number { return this.core?.value ?? 0; }

	/** Tests the value for pass/fail. If isEmpty, undefined is returned instead. */
	public test(total: number): boolean | undefined {
		if (!this.isEmpty) {
			switch (this.type) {
				case DiceTestType.Equal:
					return total === this.value;
				case DiceTestType.GreaterThan:
					return total > this.value;
				case DiceTestType.GreaterThanOrEqual:
					return total >= this.value;
				case DiceTestType.LessThan:
					return total < this.value;
				case DiceTestType.LessThanOrEqual:
					return total <= this.value;
				default:
					console.warn(`testRoll(): invalid roll.dice.test.type = ${this.type} (${this.alias})`);
			}
		}
		return undefined;
	}

	public toJSON() {
		return this.core;
	}

	/** The token key/regex used to generate DiceTestData */
	public static getParsers(): TokenParsers {
		return { test:/(gteq|gte|gt|lteq|lte|lt|eq|=+|>=|>|<=|<)\s*(\d+)/i };
	}

	/** Parses the given TokenData into DiceTestData */
	public static parse(token: TokenData): DiceTestData | undefined {
		if (token.key === "test") {
			const type = parseDiceTestType(token.matches[0]);
			const alias = [, "=", ">", ">=", "<", "<="][type];
			const value = +token.matches[1];
			return { alias, type, value };
		}
		return undefined;
	}

	/** Tests the roll for pass/fail. If isEmpty, undefined is returned instead. */
	public static test(roll: TDiceRoll): boolean | undefined {
		return new DiceTest(roll.dice.test).test(roll.total);
	}
}