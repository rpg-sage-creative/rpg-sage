import type { Proficiency } from "./Proficiency.js";

export interface IHasProficiencies {
	getProficiency(subject: string): Proficiency;
	getProficiencyMod(subject: string): number;
}