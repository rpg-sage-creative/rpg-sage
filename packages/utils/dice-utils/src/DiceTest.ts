import type { TokenData, TokenParsers } from "./types/index.js";
import type { DiceRoll } from "./types/DiceRoll.js";

export enum DiceTestType {
	None = 0,
	Equal = 1,
	GreaterThan = 2,
	GreaterThanOrEqual = 3,
	LessThan = 4,
	LessThanOrEqual = 5
}


/** The information about how to test dice results for success/failure and how to display that in the output. */
export type DiceTestData = {
	/** a human readable alternative output */
	alias?: string;
	/** wether or not this test should be hidden */
	hidden: boolean;
	/** the fundamental test */
	type: DiceTestType;
	/** the value to test against */
	value: number;
};

/** Finds the DiceTestType for the given matched value from the RegExp */
export function parseDiceTestType(matchValue: string): DiceTestType {
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

export function parseDiceTestTargetValue(rawValue: string): { value:number; hidden:boolean; } {
	const hidden = rawValue.length > 4 && rawValue.startsWith("||") && rawValue.endsWith("||");
	const value = +(hidden ? rawValue.slice(2, -2) : rawValue) || 0;
	return { value, hidden };
}

export class DiceTest {
	public constructor(protected data?: DiceTestData) { }

	public get alias(): string { return this.data?.alias ?? ""; }
	public get isEmpty(): boolean { return !this.data?.type || isNaN(this.data.value); }
	public get type(): DiceTestType { return this.data?.type ?? DiceTestType.None; }
	public get value(): number { return this.data?.value ?? 0; }

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
		return this.data;
	}

	/** The token key/regex used to generate DiceTestData */
	public static getParsers(): TokenParsers {
		return { test:/(gteq|gte|gt|lteq|lte|lt|eq|=+|>=|>|<=|<)\s*(\d+|\|\|\d+\|\|)/i };
	}

	public static createData(type: DiceTestType, value: number, hidden: boolean, alias?: string): DiceTestData {
		if (!alias) {
			alias = [undefined, "=", ">", ">=", "<", "<="][type];
		}
		return { type, value, hidden, alias };
	}

	/** Parses the given TokenData into DiceTestData */
	public static parseData(token: TokenData): DiceTestData | undefined {
		if (token.key === "test") {
			const type = parseDiceTestType(token.matches[0]);
			const { value, hidden } = parseDiceTestTargetValue(token.matches[1]);
			return DiceTest.createData(type, value, hidden);
		}
		return undefined;
	}

	/** Parses the given TokenData into DiceTestData */
	public static from(token: TokenData): DiceTest {
		return new DiceTest(DiceTest.parseData(token));
	}

	/** Tests the roll for pass/fail. If isEmpty, undefined is returned instead. */
	public static test(roll: DiceRoll): boolean | undefined {
		return new DiceTest(roll.dice.test).test(roll.total);
	}
}