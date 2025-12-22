import type { TDice } from "./dice/Dice.js";

export enum DieRollGrade { Unknown = 0, CriticalFailure = 1, Failure = 2, Success = 3, CriticalSuccess = 4 }

const DieRollGradeEmojis = [undefined, "[critical-failure]", "[failure]", "[success]", "[critical-success]"];

/** Makes sure the value is a valid failure or success value. */
function isValid(grade: number): grade is DieRollGrade {
	return [1,2,3,4].includes(grade);
}

/** Returns true if critical failure or critical success. */
export function isGradeCritical(grade: DieRollGrade): boolean {
	return grade === DieRollGrade.CriticalFailure || grade === DieRollGrade.CriticalSuccess;
}

/** Returns true if success or critical success. */
export function isGradeSuccess(grade: DieRollGrade): boolean {
	return grade === DieRollGrade.Success || grade === DieRollGrade.CriticalSuccess;
}

/** Returns true if failure or critical failure. */
export function isGradeFailure(grade: DieRollGrade): boolean {
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
export function gradeRoll(dice: TDice): DieRollGrade {
	const result = dice.test.test(dice.total);
	if (result === true) {
		return DieRollGrade.Success;
	}
	if (result === false) {
		return DieRollGrade.Failure;
	}
	return DieRollGrade.Unknown;
}
