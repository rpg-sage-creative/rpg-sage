import type { TAbility, TSavingThrow } from "../../common.js";
import { CONSTITUTION, DEXTERITY, FORTITUDE, getSavingThrows, REFLEX, toModifier, WILL, WISDOM } from "../../common.js";
import type { Armor } from "../Armor.js";
import { Check } from "./Check.js";
import { PathbuilderCharacter } from "./PathbuilderCharacter.js";
import type { PlayerCharacter } from "./PlayerCharacter.js";

export interface IHasSavingThrows { savingThrows: SavingThrows; }

/** Ensures we have a valid TSavintThrow value (and its associated TAbility). */
function parseSavingThrowAndAbility(value?: string | null): { savingThrow:TSavingThrow; ability:TAbility; } | undefined {
	if (value && /will|ref(lex)?|fort(itude)?/i.test(value)) {
		const keyLower = value.toLowerCase();
		const savingThrow = getSavingThrows().find(s => s.toLowerCase().startsWith(keyLower));
		const ability = SavingThrows.getAbilityForSavingThrow(savingThrow);
		if (savingThrow && ability) {
			return { savingThrow, ability };
		}
	}
	return undefined;
}

export abstract class SavingThrows {

	//#region Properties

	public get fortitude(): Check { return this.getCheck(FORTITUDE, CONSTITUTION)!; }
	public get fortitudeMod(): number { return this.fortitude.modifier; }

	public get reflex(): Check { return this.getCheck(REFLEX, DEXTERITY)!; }
	public get reflexMod(): number { return this.reflex.modifier; }

	public get will(): Check { return this.getCheck(WILL, WISDOM)!; }
	public get willMod(): number { return this.will.modifier; }

	//#endregion

	//#region Instance Methods

	public abstract getCheck(savingThrow: TSavingThrow, ability: TAbility): Check;
	public abstract getCheck(savingThrow: string, ability?: TAbility): Check | undefined;

	public toHtml(): string {
		return `<b>Fort</b> ${toModifier(this.fortitudeMod)}, <b>Ref</b> ${toModifier(this.reflexMod)}, <b>Will</b> ${toModifier(this.willMod)}`;
	}

	//#endregion

	//#region Static Methods

	public static getAbilityForSavingThrow(savingThrow?: TSavingThrow): TAbility | null {
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

	public static isValidKey(key?: string | null): boolean {
		return key ? /^(will|ref(lex)?|fort(itude)?)$/i.test(key) : false;
	}

	//#endregion
}

class PcSavingThrows extends SavingThrows {

	public constructor(private pc: PlayerCharacter) { super(); }

	public getCheck(savingThrow: TSavingThrow, ability?: TAbility): Check;
	public getCheck(savingThrow: string, ability?: TAbility): Check | undefined;
	public getCheck(_savingThrow: string, _ability?: TAbility): Check | undefined {
		const saveAndAbility = parseSavingThrowAndAbility(_savingThrow);
		if (!saveAndAbility) return undefined;

		const { savingThrow } = saveAndAbility;
		const ability = _ability ?? saveAndAbility.ability;

		const check = new Check(this.pc, savingThrow);

		check.addProficiency(savingThrow);

		const eqArmor = this.pc.equipment.armor;
		if (eqArmor?.hasTrait("Clumsy") && savingThrow === REFLEX) {
			check.setAbility(ability, (eqArmor.item as Armor).dexModCap, "Clumsy");
		}else {
			check.setAbility(ability);
		}

		if (eqArmor?.meta.potencyRuneValue !== undefined) {
			check.addItemModifier(eqArmor.name, eqArmor.meta.potencyRuneValue || 0);
		}
		return check;
	}

}

class PbcSavingThrows extends SavingThrows {

	public constructor(private pbc: PathbuilderCharacter) { super(); }

	public getCheck(savingThrow: TSavingThrow, ability?: TAbility): Check;
	public getCheck(savingThrow: string, ability?: TAbility): Check | undefined;
	public getCheck(_savingThrow: string, _ability?: TAbility): Check | undefined {
		const saveAndAbility = parseSavingThrowAndAbility(_savingThrow);
		if (!saveAndAbility) return undefined;

		const { savingThrow } = saveAndAbility;
		const ability = _ability ?? saveAndAbility.ability;

		const check = new Check(this.pbc, savingThrow);

		check.addProficiency(savingThrow);

		check.setAbility(ability);

		if (this.pbc.resilientBonus) {
			const desc = ["","Resilient", "Greater Resilient", "Major Resilient"][this.pbc.resilientBonus];
			check.addItemModifier(desc, this.pbc.resilientBonus);
		}
		return check;
	}

}
