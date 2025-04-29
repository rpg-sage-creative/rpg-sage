import { ColorType } from "../../model/HasColorsCore.js";
import type { TDialogType } from "./TDialogType.js";

export function getColorType(dialogType?: TDialogType): ColorType | null {
	switch (dialogType) {
		case "gm": return ColorType.GameMaster;

		case "npc": return ColorType.NonPlayerCharacter;
		case "ally": return ColorType.NonPlayerCharacterAlly;
		case "enemy": return ColorType.NonPlayerCharacterEnemy;
		case "boss": return ColorType.NonPlayerCharacterBoss;
		case "minion": return ColorType.NonPlayerCharacterMinion;

		case "pc": return ColorType.PlayerCharacter;

		case "alt": return ColorType.PlayerCharacter;
		case "companion": return ColorType.PlayerCharacterCompanion;
		case "familiar": return ColorType.PlayerCharacterFamiliar;
		case "hireling": return ColorType.PlayerCharacterHireling;
	}
	return null;
}