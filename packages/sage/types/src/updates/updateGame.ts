// import { debug } from "@rsc-utils/core-utils";
import { type OldDialogOptions, updateDialogOptions } from "./updateDialogOptions.js";
import { type OldDiceOptions, updateDiceOptions } from "./updateDiceOptions.js";
import { type OldSageChannel, updateSageChannel } from "./updateSageChannel.js";
import { type OldSystemOptions, updateSystemOptions } from "./updateSystemOptions.js";

type GameCore = OldSystemOptions & OldDiceOptions & OldDialogOptions & {
	channels: OldSageChannel[];
	id: string;
};

export function updateGame<T>(game: T): T;
export function updateGame<T extends GameCore>(game: T): T {
	// debug(`Updating Game: ${game.id} ...`);
	updateDialogOptions(game);
	updateDiceOptions(game);
	updateSystemOptions(game);
	game.channels?.forEach(updateSageChannel);
	// debug(`Updating Game: ${game.id} ... done.`);
	return game;
}