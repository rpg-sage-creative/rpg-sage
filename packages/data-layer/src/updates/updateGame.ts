// import { debug } from "@rsc-utils/core-utils";
import { ensureDialogOptionsV1, type DialogOptionsOld } from "../types/DialogOptions/index.js";
import { ensureDiceOptionsV1, type DiceOptionsOld } from "../types/DiceOptions/index.js";
import { updateSageChannel, type OldSageChannel } from "./updateSageChannel.js";
import { updateSystemOptions, type OldSystemOptions } from "./updateSystemOptions.js";

type GameCore = OldSystemOptions & DiceOptionsOld & DialogOptionsOld & {
	channels: OldSageChannel[];
	id: string;
};

export function updateGame<T>(game: T): T;
export function updateGame<T extends GameCore>(game: T): T {
	// debug(`Updating Game: ${game.id} ...`);
	ensureDialogOptionsV1(game);
	ensureDiceOptionsV1(game);
	updateSystemOptions(game);
	game.channels?.forEach(updateSageChannel);
	// debug(`Updating Game: ${game.id} ... done.`);
	return game;
}