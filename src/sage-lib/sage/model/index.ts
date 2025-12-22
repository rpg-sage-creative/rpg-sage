import type { DiceCritMethodType, DiceOutputType, DicePostType, DiceSecretMethodType } from "@rsc-sage/types";
import type { GameSystemType } from "@rsc-utils/game-utils";
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
