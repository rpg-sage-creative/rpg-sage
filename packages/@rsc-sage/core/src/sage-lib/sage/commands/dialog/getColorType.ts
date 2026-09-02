import { EmbedColorType } from "@rsc-sage/data-layer";
import type { DialogType } from "@rsc-utils/game-utils";

export function getColorType(dialogType?: DialogType): EmbedColorType | null {
	switch (dialogType) {
		case "gm": return EmbedColorType.GameMaster;

		case "npc": return EmbedColorType.NonPlayerCharacter;
		case "ally": return EmbedColorType.NonPlayerCharacterAlly;
		case "enemy": return EmbedColorType.NonPlayerCharacterEnemy;
		case "boss": return EmbedColorType.NonPlayerCharacterBoss;
		case "minion": return EmbedColorType.NonPlayerCharacterMinion;

		case "pc": return EmbedColorType.PlayerCharacter;

		case "alt": return EmbedColorType.PlayerCharacter;
		case "companion": return EmbedColorType.PlayerCharacterCompanion;
		case "familiar": return EmbedColorType.PlayerCharacterFamiliar;
		case "hireling": return EmbedColorType.PlayerCharacterHireling;
	}
	return null;
}