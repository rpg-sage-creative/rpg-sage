import type { GetStatPrefix, TAbility, TSavingThrow } from "../../common";
import { CONSTITUTION, DEXTERITY, FORTITUDE, getSavingThrows, REFLEX, toModifier, WILL, WISDOM } from "../../common";
import type { Armor } from "../Armor";
import { Check } from "./Check";
import { PathbuilderCharacter } from "./PathbuilderCharacter";
import type { PlayerCharacter } from "./PlayerCharacter";

export interface IHasSavingThrows { savingThrows: SavingThrows; }

export abstract class SavingThrows {

	//#region Properties

	public get fortitude(): Check { return this.getSavingThrow(FORTITUDE, CONSTITUTION); }
	public get fortitudeMod(): number { return this.fortitude.modifier; }

	public get reflex(): Check { return this.getSavingThrow(REFLEX, DEXTERITY); }
	public get reflexMod(): number { return this.reflex.modifier; }

	public get will(): Check { return this.getSavingThrow(WILL, WISDOM); }
	public get willMod(): number { return this.will.modifier; }

	//#endregion

	//#region Instance Methods

	public abstract getSavingThrow(savingThrow: TSavingThrow, ability?: TAbility): Check;

	public getStat(statLower: string, prefix: GetStatPrefix): number | string | null {
		const savingThrow = getSavingThrows().find(save => {
			const lower = save.toLowerCase();
			if (statLower === "fort" && save === "Fortitude") return true;
			if (statLower === "ref" && save === "Reflex") return true;
			return statLower === lower;
		});
		if (savingThrow) {
			switch(prefix) {
				case "dc": return this.getSavingThrow(savingThrow).dc;
				case "mod": return this.getSavingThrow(savingThrow).modifier;
				case "prof": return this.getSavingThrow(savingThrow).proficiencyModifier?.modifier ?? 0;
				case "proficiency": return this.getSavingThrow(savingThrow).proficiencyModifier?.proficiency ?? null;
				default: return this.getSavingThrow(savingThrow).modifier;
			}
		}
		return null;
	}

	public toHtml(): string {
		return `<b>Fort</b> ${toModifier(this.fortitudeMod)}, <b>Ref</b> ${toModifier(this.reflexMod)}, <b>Will</b> ${toModifier(this.willMod)}`;
	}

	//#endregion

	//#region Static Methods

	public static getAbilityForSavingThrow(savingThrow: TSavingThrow): TAbility | null {
		switch (savingThrow) {
			case FORTITUDE: return CONSTITUTION;
			case REFLEX: return DEXTERITY;
			case WILL: return WISDOM;
			default: return null;
		}
	}

	public static for(pc: PlayerCharacter | PathbuilderCharacter): SavingThrows {
		if (pc instanceof PathbuilderCharacter) {
			return new PbcSavingThrows(pc);
		}
		return new PcSavingThrows(pc);
	}

	//#endregion
}

class PcSavingThrows extends SavingThrows {

	public constructor(private pc: PlayerCharacter) { super(); }

	public getSavingThrow(savingThrow: TSavingThrow, ability = SavingThrows.getAbilityForSavingThrow(savingThrow) ?? CONSTITUTION): Check {
		const eqArmor = this.pc.equipment.armor,
			check = new Check(this.pc, savingThrow);
		check.setAbility(ability);
		if (eqArmor && eqArmor.hasTrait("Clumsy") && savingThrow === REFLEX) {
			check.setAbility(ability, (<Armor>eqArmor.item).dexModCap, "Clumsy");
		}
		check.addProficiency(savingThrow);
		if (eqArmor && eqArmor.meta.potencyRuneValue !== undefined) {
			check.addItemModifier(eqArmor.name, eqArmor.meta.potencyRuneValue || 0);
		}
		return check;
	}

}

class PbcSavingThrows extends SavingThrows {

	public constructor(private pbc: PathbuilderCharacter) { super(); }

	public getSavingThrow(savingThrow: TSavingThrow, ability = SavingThrows.getAbilityForSavingThrow(savingThrow) ?? CONSTITUTION): Check {
		const check = new Check(this.pbc, savingThrow);
		check.level = this.pbc.getLevelMod(true);
		check.setAbility(ability);
		check.addProficiency(savingThrow);
		if (this.pbc.resilientBonus) {
			const desc = ["","Resilient", "Greater Resilient", "Major Resilient"][this.pbc.resilientBonus];
			check.addItemModifier(desc, this.pbc.resilientBonus);
		}
		return check;
	}

}
