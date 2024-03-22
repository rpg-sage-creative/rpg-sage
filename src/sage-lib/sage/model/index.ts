import type { DiceCritMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, GameSystemType, SageChannel } from "@rsc-sage/types";
import type { Snowflake } from "@rsc-utils/snowflake-utils";
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

export type HasChannels = {
	channel: SageChannel | undefined;
	channelDid: Snowflake | undefined;
	gameChannel: SageChannel | undefined;
	serverChannel: SageChannel | undefined;
	threadDid: Snowflake | undefined;
	threadOrChannelDid: Snowflake;
};
