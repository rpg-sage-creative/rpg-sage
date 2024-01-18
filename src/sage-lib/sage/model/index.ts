import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { GameType } from "../../../sage-common";
import type { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import type { DicePostType } from "../commands/dice";
import type { IChannel } from "../repo/base/IdRepository";
import * as activeBot from "./ActiveBot";
import * as bot from "./Bot";
import * as characterManager from "./CharacterManager";
import * as charactersMatch from "./CharactersMatch";
import * as colors from "./Colors";
import * as emoji from "./Emoji";
import * as game from "./Game";
import GameCharacter, * as gameCharacter from "./GameCharacter";
import * as hasColorsCore from "./HasColorsCore";
import * as hasEmojiCore from "./HasEmojiCore";
import * as namedCollection from "./NamedCollection";
import * as noteManager from "./NoteManager";
import * as sageCache from "./SageCache";
import * as sageMessage from "./SageMessage";
import * as sageMessageArgsManager from "./SageMessageArgsManager";
import * as sageReaction from "./SageReaction";
import * as server from "./Server";
import * as user from "./User";

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

export default {
	activeBot,
	bot,
	characterManager,
	charactersMatch,
	colors,
	emoji,
	game,
	gameCharacter,
	hasColorsCore,
	hasEmojiCore,
	namedCollection,
	noteManager,
	sageCache,
	sageMessage,
	sageMessageArgsManager,
	sageReaction,
	server,
	user
};
