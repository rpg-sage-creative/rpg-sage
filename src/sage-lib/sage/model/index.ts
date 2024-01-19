import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { GameType } from "../../../sage-common";
import type { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import type { DicePostType } from "../commands/dice";
import type { IChannel } from "../repo/base/IdRepository";
import { GameCharacter } from "./GameCharacter";

export interface IHasGame {
	gameType: GameType;
	isGameMaster: boolean;
	isPlayer: boolean;
	playerCharacter: GameCharacter | undefined;

	critMethodType: CritMethodType;
	dicePostType: DicePostType;
	diceOutputType: DiceOutputType;
	diceSecretMethodType: DiceSecretMethodType;
}

export interface IHasChannels {
	channel: IChannel | undefined;
	channelDid: Snowflake | undefined;
	gameChannel: IChannel | undefined;
	serverChannel: IChannel | undefined;
	threadDid: Snowflake | undefined;
	threadOrChannelDid: Snowflake;
}
