import type { PlayerCharacterCoreE20, TArmorE20, TWeaponE20 } from "../common/PlayerCharacterE20";
import PlayerCharacterE20 from "../common/PlayerCharacterE20";

export type TArmorJoe = TArmorE20 & {
	upgrades?: string;
};

export type TWeaponJoe = TWeaponE20 & {
	upgrades?: string;
};

export interface PlayerCharacterCoreJoe extends PlayerCharacterCoreE20 {
	gameType: "E20 - G.I. Joe";

	armor: TArmorJoe[];
	focus?: string;
	gear?: string;
	training?: string;
	weapons: TWeaponJoe[];
}

export default class PlayerCharacterJoe extends PlayerCharacterE20<PlayerCharacterCoreJoe> {
	public toHtml(): string { return ""; }
}
