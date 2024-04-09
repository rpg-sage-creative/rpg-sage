import type { GameOptions, SageChannel } from "@rsc-sage/types";
import { applyChanges, isEmpty } from "@rsc-utils/json-utils";
import type { Args } from "@rsc-utils/type-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import { Game, type IGameUser } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { getGameChannels } from "./getGameChannels.js";
import { getGameUsers } from "./getGameUsers.js";
import { gSendDetails } from "./gSendDetails.js";

function updateGame(sageCommand: SageCommand, gameOptions: Args<GameOptions>, channels: SageChannel[], users: IGameUser[]): Game {
	const game = sageCommand.game!.toJSON();
	applyChanges(game, gameOptions);
	return new Game({
		...game,
		channels: game.channels.concat(channels),
		users: (game.users ?? []).concat(users)
	}, sageCommand.server, sageCommand.sageCache);
}

async function gameUpdate(sageCommand: SageCommand): Promise<boolean | undefined | null> {

	// get channels first to avoid more logic if we are going to exit early for reused channels
	const gameChannels = await getGameChannels(sageCommand, false);
	if (!gameChannels.used.length) {
		// exit out with warning about reusing channels
		return undefined;
	}

	// get gameOptions from args
	const gameOptions = sageCommand.args.getGameOptions() ?? { };

	// get users from args
	const gameUsers = await getGameUsers(sageCommand);

	// exit out to the command example feedback
	if (isEmpty(gameOptions) && !gameChannels.free.length && !gameUsers.length) {
		return null;
	}

	const game = updateGame(sageCommand, gameOptions, gameChannels.free, gameUsers);
	await gSendDetails(sageCommand, game);
	const update = await discordPromptYesNo(sageCommand, `Update Game?`);

	if (update) {
		const gameSaved = game ? await game.save() : false;
		const serverSaved = gameSaved ? await sageCommand.server.save() : false;
		return gameSaved && serverSaved;
	}
	return undefined;
}

export async function gCmdUpdate(sageCommand: SageCommand): Promise<void> {
	if (!sageCommand.game) {
		await sageCommand.whisper("There is no Game to update!");
		return;
	}

	if (!sageCommand.canAdminGame) {
		await sageCommand.whisper("Sorry, you aren't allowed to update this Game.");
		return;
	}

	sageCommand.noDefer();

	const updated = await gameUpdate(sageCommand);
	if (updated === true) {
		await sageCommand.whisper({ content:"Game Updated." });

	}else if (updated === false) {
		await sageCommand.whisper({ content:"Unknown Error; Game NOT Updated!" });

	}else if (updated === null) {
		await sageCommand.whisper({ content:"Please try /sage-game-update" });

	}else if (updated === undefined) {
		// do nothing
	}
}