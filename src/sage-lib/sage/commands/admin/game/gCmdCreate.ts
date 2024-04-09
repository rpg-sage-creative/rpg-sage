import { type GameOptions, type SageChannel } from "@rsc-sage/types";
import { applyChanges } from "@rsc-utils/json-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import { Game, type IGameUser } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { getGameChannels } from "./getGameChannels.js";
import { getGameUsers } from "./getGameUsers.js";
import { gFixPerms } from "./gFixPerms.js";
import { gSendDetails } from "./gSendDetails.js";

function createGame(sageCommand: SageCommand, gameOptions: Partial<GameOptions>, channels: SageChannel[], users: IGameUser[]): Game {
	return new Game({
		objectType: "Game",
		id: randomUuid(),
		serverDid: sageCommand.server.did,
		serverId: sageCommand.server.id,
		createdTs: new Date().getTime(),
		channels: channels,
		colors: sageCommand.server.colors.toArray(),
		users,
		...gameOptions,
		name: gameOptions.name!,
	}, sageCommand.server, sageCommand.sageCache);
}

function getGameOptions(sageCommand: SageCommand): GameOptions {
	// get default gameOptions from server
	const { dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName } = sageCommand.server;
	const gameOptions = { dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName } as GameOptions;

	// get gameOptions from args applied to server defaults
	const gameOptionArgs = sageCommand.args.getGameOptions() ?? { };
	applyChanges(gameOptions, gameOptionArgs);

	return gameOptions;
}

async function gameCreate(sageCommand: SageCommand): Promise<boolean | undefined | null> {
	// get channels first to avoid more logic if we are going to exit early for reused channels
	const gameChannels = await getGameChannels(sageCommand, true);
	if (!gameChannels.used.length) {
		// exit out with warning about reusing channels
		return undefined;
	}

	// get gameOptions from args applied to server defaults
	const gameOptions = getGameOptions(sageCommand);

	// get users from args
	const gameUsers = await getGameUsers(sageCommand);

	// exit out to the command example feedback
	if (!gameOptions.name || !gameChannels.free.length) {
		return null;
	}

	const game = createGame(sageCommand, gameOptions, gameChannels.free, gameUsers);
	await gSendDetails(sageCommand, game);
	const create = await discordPromptYesNo(sageCommand, `Create Game?`);

	if (create) {
		const gameSaved = game ? await game.save() : false;
		const serverSaved = gameSaved ? await sageCommand.server.save() : false;
		if (gameSaved && serverSaved) {
			await gFixPerms(sageCommand, game);
			return true;
		}
	}
	return undefined;
}

export async function gCmdCreate(sageCommand: SageCommand): Promise<void> {
	if (!sageCommand.canAdminGames) {
		await sageCommand.whisper("Sorry, you aren't allowed to create Games.");
		return;
	}

	sageCommand.noDefer();

	const updated = await gameCreate(sageCommand);
	if (updated === true) {
		await sageCommand.whisper({ content:"Game Created." });

	}else if (updated === false) {
		await sageCommand.whisper({ content:"Unknown Error; Game NOT Created!" });

	}else if (updated === null) {
		await sageCommand.whisper({ content:"Please try /sage-game-create" });

	}else if (updated === undefined) {
		// do nothing
	}
}
