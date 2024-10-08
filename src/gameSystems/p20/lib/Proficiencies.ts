import type { Proficiency } from "./Proficiency.ts";

export interface IHasProficiencies {
	getProficiency(subject: string): Proficiency;
	getProficiencyMod(subject: string): number;
}