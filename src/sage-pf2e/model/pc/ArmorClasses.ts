import { ARMOR_UNARMORED, DEXTERITY, NO_ARMOR, NO_SHIELD } from "../../common";
import * as Repository from "../../data/Repository";
import type Armor from "../Armor";
import type Shield from "../Shield";
import Check from "./Check";
import type PlayerCharacter from "./PlayerCharacter";

export default class ArmorClasses {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(private pc: PlayerCharacter) { }

	/**************************************************************************************************************************/
	// Properties

	public get armorClass(): Check {
		const eqArmor = this.pc.equipment.armor,
			armor = eqArmor?.item as Armor ?? Repository.findByValue("Armor", NO_ARMOR)!,
			// armorBonus = (acOrTAC == AC ? armor.acBonus : armor.tacBonus) || 0,
			armorPotency = eqArmor && eqArmor.meta.potencyRuneValue !== undefined && eqArmor.meta.potencyRuneValue || 0,
			eqShield = this.pc.equipment.raisedShield,
			shield = eqShield?.item as Shield ?? Repository.findByValue("Shield", NO_SHIELD)!,
			// shieldBonus = (acOrTAC == AC ? shield.acBonus : shield.tacBonus) || 0,
			check = new Check(this.pc, "AC");
		check.setAbility(DEXTERITY, armor.dexModCap);
		check.addProficiency(armor.category === ARMOR_UNARMORED ? armor.category : armor.category + " Armor");
		check.addItemModifier(armor.name, (armor.acBonus || 0) + armorPotency);
		if (eqShield) {
			/*// check.addProficiency(ARMOR_SHIELDS);*/
			check.addCircumstanceModifier(shield.name, shield.acBonus || 0);
		}
		return check;
	}
	public get ac(): number { return this.armorClass.dc; }
	public get acMod(): number { return this.armorClass.modifier; }
}
