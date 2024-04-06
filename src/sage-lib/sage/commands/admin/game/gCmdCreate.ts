import { SageChannelType, type GameOptions, type SageChannel } from "@rsc-sage/types";
import { debug } from "@rsc-utils/console-utils";
import { DiscordKey, toChannelMention } from "@rsc-utils/discord-utils";
import { isEmpty } from "@rsc-utils/json-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import { Game, GameUserType, type IGameUser } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { gameDetails } from "./gameDetails.js";
import { getGameValues } from "./getGameValues.js";

function getGameChannels(sageCommand: SageCommand): SageChannel[] {
	const channels: SageChannel[] = [];

	const icIds = sageCommand.args.getChannelIds("ic");
	icIds.forEach(id => channels.push({ id, type:SageChannelType.InCharacter }));

	const oocIds = sageCommand.args.getChannelIds("ooc");
	oocIds.forEach(id => channels.push({ id, type:SageChannelType.OutOfCharacter }));

	const gmIds = sageCommand.args.getChannelIds("gm");
	gmIds.forEach(id => channels.push({ id, type:SageChannelType.GameMaster }));

	const diceIds = sageCommand.args.getChannelIds("dice");
	diceIds.forEach(id => channels.push({ id, type:SageChannelType.Dice }));

	if (!channels.length && sageCommand.channelDid) {
		channels.push({ id:sageCommand.channelDid, type:SageChannelType.OutOfCharacter });
	}

	return channels;
}

async function getGameUsers(sageCommand: SageCommand): Promise<IGameUser[]> {
	const users: IGameUser[] = [];

	// do both "gm" and "gms" in case a posted command has the old gm= for the GM and not for the GM Channel
	const gmIds = await sageCommand.args.getUserIds("gm", true);
	gmIds.forEach(did => users.push({ did, type:GameUserType.GameMaster, dicePing:true }));
	const gmsIds = await sageCommand.args.getUserIds("gms", true);
	gmsIds.forEach(did => users.push({ did, type:GameUserType.GameMaster, dicePing:true }));

	const playerIds = await sageCommand.args.getUserIds("players", true);
	playerIds.forEach(did => users.push({ did, type:GameUserType.Player, dicePing:true }));

	return users;
}

function createGame(sageCommand: SageCommand, name: string, gameValues: Partial<GameOptions>, channels: SageChannel[], users: IGameUser[]): Game {
	return new Game({
		objectType: "Game",
		id: randomUuid(),
		serverDid: sageCommand.server.did,
		serverId: sageCommand.server.id,
		createdTs: new Date().getTime(),
		channels: channels,
		colors: sageCommand.server.colors.toArray(),
		users,
		...gameValues,
		name,
	}, sageCommand.server, sageCommand.sageCache);
}

async function postGameCreate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGames) {
		return sageMessage.reactBlock("Sorry, You aren't allowed to create Games.");
	}

	const updated = await gameCreate(sageMessage);
	if (updated === true) {
		await sageMessage.reactSuccess("Game Created.");

	}else if (updated === false) {
		await sageMessage.reactFailure("Unknown Error; Game NOT Created!");

	}else if (updated === null) {
		await sageMessage.reactFailure("Please try:\n`sage!!game create name=\"GAME NAME\" type=\"PF2E\" ic=\"#IN_CHARACTER_CHANNEL\" ooc=\"OUT_OF_CHARACTER_CHANNEL\" gms=\"@GM_MENTION\" players=\"@PLAYER_ROLE_MENTION\"`");

	}else if (updated === undefined) {
		// do nothing

	}
}

async function slashGameCreate(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.interaction.deferReply().then(() => sageInteraction.interaction.deleteReply());

	const updated = await gameCreate(sageInteraction);
	if (updated === true) {
		await sageInteraction.whisper({ content:"Game Created." });

	}else if (updated === false) {
		await sageInteraction.whisper({ content:"Unknown Error; Game NOT Created!" });

	}else if (updated === null) {
		await sageInteraction.whisper({ content:"Please try /sage-game-create" });

	}else if (updated === undefined) {
		// do nothing
	}
}

async function gameCreate(sageCommand: SageCommand): Promise<boolean | undefined | null> {
	const server = sageCommand.server;
	const name = sageCommand.args.getString("name");
	const gameValues = getGameValues(sageCommand);
	const gameChannels = getGameChannels(sageCommand);
	const gameUsers = await getGameUsers(sageCommand);

	const freeGameChannels: SageChannel[] = [];
	const usedGameChannels: SageChannel[] = [];
	for (const channel of gameChannels) {
		const discordKey = new DiscordKey(server.did, channel.id);
		const otherGame = await sageCommand.sageCache.games.findActiveByDiscordKey(discordKey);
		if (otherGame) {
			usedGameChannels.push(channel);
		}else {
			freeGameChannels.push(channel);
		}
	}
	if (usedGameChannels.length) {
		const channelLinks = usedGameChannels.map(channel => "\n- " + toChannelMention(channel.id));
		const channelist = channelLinks.join("");
		await sageCommand.whisper(`The following channels are already part of a game:` + channelist);
		return undefined;
	}

	const hasName = !!name;
	const hasValues = !isEmpty(gameValues);
	const hasChannel = !!freeGameChannels.length;
	if (!hasName || !hasValues || !hasChannel) {
		return null;
	}

	const game = createGame(sageCommand, name, gameValues, freeGameChannels, gameUsers);
	await gameDetails(sageCommand, true, game);
	const create = await discordPromptYesNo(sageCommand, `Create Game?`);

	if (create) {
		const gameSaved = game ? await game.save() : false;
		const serverSaved = gameSaved ? await sageCommand.server.save() : false;
		return gameSaved && serverSaved;
	}
	return undefined;
}

export async function gCmdCreate(sageCommand: SageCommand): Promise<void> {
	if (sageCommand.isSageMessage()) return postGameCreate(sageCommand);
	if (sageCommand.isSageInteraction()) return slashGameCreate(sageCommand);
	debug(`Unused Handler: gCmdCreate`);
}
