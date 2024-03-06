import { sortByKey } from "@rsc-utils/array-utils";
import type { TProficiency } from "../../common";
import { DEXTERITY, EXPERT, LEGENDARY, MASTER, NO_ARMOR, TRAINED, UNTRAINED } from "../../common";
import { all, findByValue } from "../../data/Repository";
import type { Action } from "../Action";
import type { Armor } from "../Armor";
import type { Shield } from "../Shield";
import type { Skill } from "../Skill";
import { Check } from "./Check";
import type { EquipmentItem } from "./EquipmentItem";
import type { PlayerCharacter } from "./PlayerCharacter";

export class Skills {

	public constructor(public pc: PlayerCharacter) { }

	public get checks(): Check[] {
		return this.skills.map(skill => this.getCheck(skill));
	}
	public get proficiencies(): TProficiency[] {
		return this.skills.map(skill => this.pc.getProficiency(skill.name));
	}
	public get skills(): Skill[] {
		const skills: Skill[] = [];
		all("Skill").forEach(skill => {
			if (skill.hasSpecialty) {
				skills.push(...skill.specialties);
			} else {
				skills.push(skill);
			}
		});
		skills.sort(sortByKey("name"));
		return skills;
	}

	public get untrained(): Skill[] {
		return this.skills.filter(skill => this.pc.getProficiency(skill.name) === UNTRAINED);
	}
	public get trained(): Skill[] {
		return this.skills.filter(skill => this.pc.getProficiency(skill.name) === TRAINED);
	}
	public get expert(): Skill[] {
		return this.skills.filter(skill => this.pc.getProficiency(skill.name) === EXPERT);
	}
	public get master(): Skill[] {
		return this.skills.filter(skill => this.pc.getProficiency(skill.name) === MASTER);
	}
	public get legendary(): Skill[] {
		return this.skills.filter(skill => this.pc.getProficiency(skill.name) === LEGENDARY);
	}

	/**************************************************************************************************************************/
	// Instance Methods

	public getCheck(skill: Skill): Check;
	public getCheck(skill: Skill, action: Action): Check;
	public getCheck(skillName: string): Check;
	public getCheck(skillOrName: Skill | string, action?: Action): Check {
		const skill = ensure("Skill", skillOrName),
			check = new Check(this.pc, action?.name ?? skill.name);
		check.setAbility(skill.ability);
		check.addProficiency(skill.name);

		const eqArmor = this.pc.equipment.armor,
			eqShield = this.pc.equipment.shield,
			isAttack = action && action.traits.includes("Attack");
		if (eqArmor || eqShield) {
			const armor = getItemOrDefault(eqArmor, "Armor", NO_ARMOR);
			if (armor.hasTrait("Clumsy") && skill.ability === DEXTERITY && !isAttack) {
				check.setAbility(skill.ability, armor.dexModCap, "Clumsy");
			}
			if (skill.hasArmorPenalty && !isAttack) {
				applyArmorCheckPenalty(check, skill, armor);
			}
		}

		/*// warn("Add Skill item and other bonuses/penalties");*/
		return check;
	}
	public isTrained(skill: Skill): boolean;
	public isTrained(skillName: string): boolean;
	public isTrained(skillOrName: Skill | string): boolean {
		const skillName = typeof (skillOrName) === "string" ? skillOrName : skillOrName.name;
		/*
		// let deity = this.pc.bio.deity;
		// if (skillName === "Deity Lore" && deity) {
		// 	skillName = `${deity} Lore`;
		// }
		*/
		return this.pc.getProficiency(skillName) !== UNTRAINED;
	}

}

function ensure<T extends Skill>(objectType: string, objectOrName: T | string): T {
	return typeof (objectOrName) === "string"
		? findByValue(objectType, objectOrName) as T
		: objectOrName;
}

function getItemOrDefault<T extends Armor>(equipmentItem: EquipmentItem | undefined, objectType: "Armor", defaultName: string): T;
function getItemOrDefault<T extends Shield>(equipmentItem: EquipmentItem | undefined, objectType: "Shield", defaultName: string): T;
function getItemOrDefault<T extends Armor | Shield>(equipmentItem: EquipmentItem | undefined, objectType: string, defaultName: string): T {
	return equipmentItem?.item as T ?? findByValue(objectType, defaultName);
}

function applyArmorCheckPenalty(check: Check, skill: Skill, armor: Armor): void {
	if (armor.checkPenalty) {
		check.addUntypedModifier(armor.name, armor.checkPenalty);
		if (skill.name === "Stealth" && armor.hasTrait("Noisy")) {
			check.addUntypedModifier("Noisy", -1);
		}
	}
}
