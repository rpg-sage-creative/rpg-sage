import { DiceTest } from "./DiceTest";
import type { DiceRoll } from "./types/DiceRoll.js";

export enum DieRollGrade { Unknown = 0, CriticalFailure = 1, Failure = 2, Success = 3, CriticalSuccess = 4 }

type TDieRollGradeEmoji = undefined | "[critical-success]" | "[success]" | "[failure]" | "[critical-failure]";

const DieRollGradeEmojis: TDieRollGradeEmoji[] = [undefined, "[critical-failure]", "[failure]", "[success]", "[critical-success]"];

export function isGradeSuccess(grade: DieRollGrade): boolean {
	return grade === DieRollGrade.Success || grade === DieRollGrade.CriticalSuccess;
}

export function isGradeFailure(grade: DieRollGrade): boolean {
	return grade === DieRollGrade.Failure || grade === DieRollGrade.CriticalFailure;
}

export function increaseGrade(grade: DieRollGrade): DieRollGrade {
	return ensureGrade(grade + 1, grade);
}

export function decreaseGrade(grade: DieRollGrade): DieRollGrade {
	return ensureGrade(grade - 1, grade);
}

function ensureGrade(grade: DieRollGrade, defaultGrade: DieRollGrade): DieRollGrade {
	return grade && DieRollGrade[grade] ? grade : defaultGrade;
}

export function gradeToEmoji(grade: DieRollGrade): TDieRollGradeEmoji {
	return grade ? DieRollGradeEmojis[grade] : undefined;
}

function booleanToGrade(value: boolean | undefined): DieRollGrade {
	switch(value) {
		case true: return DieRollGrade.Success;
		case false: return DieRollGrade.Failure;
		default: return DieRollGrade.Unknown;
	}
}

export function gradeRoll(roll: DiceRoll): DieRollGrade {
	return booleanToGrade(DiceTest.test(roll));
}
