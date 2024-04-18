// import { debug } from "@rsc-utils/console-utils";
import { OldDialogOptions, updateDialogOptions } from "./updateDialogOptions.js";
import { OldDiceOptions, updateDiceOptions } from "./updateDiceOptions.js";
import { updateSageChannel, type OldSageChannel } from "./updateSageChannel.js";
import { OldSystemOptions, updateSystemOptions } from "./updateSystemOptions.js";

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