import type { DiceOutputType, DicePostType } from "@rsc-sage/types";
import type { DiceCriticalMethodType, DiceSecretMethodType, GameSystemType } from "@rsc-utils/game-utils";
import { GameCharacter } from "./GameCharacter.js";

export interface HasGame {
	gameSystemType: GameSystemType;
	isGameMaster: boolean;
	isPlayer: boolean;
	playerCharacter: GameCharacter | undefined;

	diceCritMethodType: DiceCriticalMethodType;
	dicePostType: DicePostType;
	diceOutputType: DiceOutputType;
	diceSecretMethodType: DiceSecretMethodType;
}
