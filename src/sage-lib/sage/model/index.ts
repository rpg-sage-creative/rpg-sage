import type { DiceCritMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, GameSystemType } from "@rsc-sage/types";
import { GameCharacter } from "./GameCharacter.js";

export interface HasGame {
	gameSystemType: GameSystemType;
	isGameMaster: boolean;
	isPlayer: boolean;
	playerCharacter: GameCharacter | undefined;

	diceCritMethodType: DiceCritMethodType;
	dicePostType: DicePostType;
	diceOutputType: DiceOutputType;
	diceSecretMethodType: DiceSecretMethodType;
}
