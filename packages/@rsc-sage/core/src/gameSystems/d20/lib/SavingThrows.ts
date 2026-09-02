import type { AbilityNameResolvable } from "./Ability.js";
import type { Check as CheckD20 } from "./Check.js";
import { SavingThrow, type SavingThrowNameResolvable } from "./SavingThrow.js";

export interface IHasSavingThrows<Check extends CheckD20> { savingThrows: SavingThrows<Check>; }

export abstract class SavingThrows<Check extends CheckD20> {

	//#region Properties

	public get fortitude(): Check { return this.getCheck("Fortitude"); }
	public get fortitudeMod(): number { return this.fortitude.modifier; }

	public get reflex(): Check { return this.getCheck("Reflex"); }
	public get reflexMod(): number { return this.reflex.modifier; }

	public get will(): Check { return this.getCheck("Will"); }
	public get willMod(): number { return this.will.modifier; }

	//#endregion

	//#region Instance Methods

	public getSavingThrowModifier(savingThrow: SavingThrowNameResolvable): number {
		return this.getCheck(savingThrow)?.modifier ?? 0;
	}

	public getSavingThrowDc(savingThrow: SavingThrowNameResolvable): number {
		const check = this.getCheck(savingThrow);
		return check ? SavingThrow.modToDc(check.modifier) : 0;
	}

	/** If ability is not provided, the default ability for the save is used. */
	public abstract getCheck(savingThrow: SavingThrowNameResolvable, ability?: AbilityNameResolvable): Check;
	public abstract getCheck(savingThrow: string, ability?: AbilityNameResolvable): Check | undefined;

	//#endregion

}
