import type { Optional } from "@rsc-utils/core-utils";
import type { TDice } from "./dice/Dice.js";
import { DiceTest, type DiceTestData } from "./DiceTest.js";

export enum DieRollGrade { Unknown = 0, CriticalFailure = 1, Failure = 2, Success = 3, CriticalSuccess = 4 }

// type DieRollGradeEmoji = typeof DieRollGradeEmojis[number];
const DieRollGradeEmojis = [undefined, "[critical-failure]", "[failure]", "[success]", "[critical-success]"] as const;

/** Makes sure the value is a valid failure or success value. */
function isValid(grade: Optional<DieRollGrade>): grade is DieRollGrade {
	return [1,2,3,4].includes(grade as number);
}

/** Returns true if critical failure or critical success. */
export function isGradeCritical(grade: DieRollGrade): boolean {
	return grade === DieRollGrade.CriticalFailure || grade === DieRollGrade.CriticalSuccess;
}

/** Returns true if success or critical success. */
export function isGradeSuccess(grade: Optional<DieRollGrade>): grade is DieRollGrade.Success | DieRollGrade.CriticalSuccess {
	return grade === DieRollGrade.Success || grade === DieRollGrade.CriticalSuccess;
}

/** Returns true if failure or critical failure. */
export function isGradeFailure(grade: Optional<DieRollGrade>): grade is DieRollGrade.Failure | DieRollGrade.CriticalFailure {
	return grade === DieRollGrade.Failure || grade === DieRollGrade.CriticalFailure;
}

/** Increases the grade by 1 without going higher than critical success. */
export function increaseGrade(grade: DieRollGrade): DieRollGrade {
	return isValid(grade) ? ensureGrade(grade + 1, grade) : DieRollGrade.Unknown;
}

/** Descreases the grade by 1 without going lower than critical failure. */
export function decreaseGrade(grade: DieRollGrade): DieRollGrade {
	return isValid(grade) ? ensureGrade(grade - 1, grade) : DieRollGrade.Unknown;
}

/** Returns the modified grade, if valid, or the original grade. */
function ensureGrade(modifiedGrade: DieRollGrade, originalGrade: DieRollGrade): DieRollGrade {
	return isValid(modifiedGrade) ? modifiedGrade : originalGrade;
}

/** Returns the bracket name Sage uses for dice results emoji based on the grade. Ex: [success] or [failure] */
export function gradeToEmoji(grade: DieRollGrade, _hasTest?: boolean): string | undefined {
	return isValid(grade) ? DieRollGradeEmojis[grade] : undefined;
}

/** Grades the given dice roll to simple success/failure/unknown. No critical logic. */
export function gradeRoll(dice: TDice): DieRollGrade;
/** @deprecated use gradeRoll(dice: TDice) */
export function gradeRoll(roll: { test?:DiceTestData; total:number; }): DieRollGrade;
export function gradeRoll(dice: TDice | { test?:DiceTestData; total:number; }): DieRollGrade {
	let result: boolean | undefined;
	if (dice.test && !("test" in dice.test)) {
		result = new DiceTest(dice.test).test(dice.total)
	}else {
		result = dice.test?.test(dice.total);
	}
	if (result === true) {
		return DieRollGrade.Success;
	}
	if (result === false) {
		return DieRollGrade.Failure;
	}
	return DieRollGrade.Unknown;
}