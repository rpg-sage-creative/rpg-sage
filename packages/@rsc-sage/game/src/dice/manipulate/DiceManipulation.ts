import type { RollData } from "../types/RollData.js";

export type DiceManipulationArgs = {
	allRolls: RollData[];
	notDropped: RollData[];
	unusedFixedRolls: number[];
};

export type DiceManipulationResults = {
	additionalRolls: RollData[];
	fixedRollsUsed: number;
};

export abstract class DiceManipulation<DataType> {

	public constructor(protected data?: DataType) { }

	public get isEmpty(): boolean { return !this.type || !this.value; }
	public abstract get type(): number;
	public abstract get value(): number;

	public abstract manipulateRolls(args: DiceManipulationArgs): DiceManipulationResults | void;

	public toJSON(): DataType | undefined {
		return this.isEmpty ? undefined : this.data;
	}

	public abstract toString(leftPad?: string, rightPad?: string): string;
}
