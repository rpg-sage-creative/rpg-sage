import { DidCore, HasDidCore } from "../../sage-lib/sage/repo/base/DidRepository";

export type TArmorE20 = {
	name?: string;
	description?: string;
	effect?: string;
	traits?: string;
};

export type TAttackE20 = {
	attack?: string;
	name?: string;
	range?: string;
	effects?: string;
	notes?: string;
};

export type TSkillE20 = {
	name: string;
	bonus?: number;
	die?: string;
	specializations?: TSkillSpecialization[];
};

type TSkillSpecialization = {
	name: string;
	checked: boolean;
};

export type TStatE20 = {
	ability?: string;
	abilityName: string;
	armor?: string;
	bonus?: string;
	defense?: string;
	defenseName: string;
	essence?: string;
	perks?: string;
	skills: TSkillE20[];
};

export type TWeaponE20 = {
	name?: string;
	range?: string;
	hands?: string;
	traits?: string;
	attack?: string;
	effects?: string;
	altEffects?: string;
};

export type TWeaponJoe = TWeaponE20 & {
	upgrades?: string;
};

export interface PlayerCharacterCoreE20 extends DidCore<"PlayerCharacter"> {
	diceEngine: "E20";
	gameType: string;
	userDid?: string;

	abilities: TStatE20[];
	armor: TArmorE20[];
	attacks: TAttackE20[];
	backgroundBonds?: string;
	name: string;
	damage?: number;
	description?: string;
	hangUps?: string;
	health?: string;
	influences?: string;
	languages?: string;
	level?: string;
	movement?: string;
	notes?: string;
	origin?: string;
	perks?: string;
	pronouns?: string;
	role?: string;
	weapons: TWeaponE20[];
}

export default abstract class PlayerCharacterE20<T extends PlayerCharacterCoreE20> extends HasDidCore<T> {

	abstract toHtml(): string;
}
