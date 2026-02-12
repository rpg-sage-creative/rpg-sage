// import { debug } from "@rsc-utils/core-utils";
import { type OldDialogOptions, updateDialogOptions } from "./updateDialogOptions.js";
import { type OldDiceOptions, updateDiceOptions } from "./updateDiceOptions.js";
import { type OldSageChannel, updateSageChannel } from "./updateSageChannel.js";
import { type OldSystemOptions, updateSystemOptions } from "./updateSystemOptions.js";

type ServerCore = OldSystemOptions & OldDiceOptions & OldDialogOptions & {
	channels: OldSageChannel[];
	id: string;
};

export function updateServer<T>(server: T): T;
export function updateServer<T extends ServerCore>(server: T): T {
	// debug(`Updating Server: ${server.id} ...`);
	updateDialogOptions(server);
	updateDiceOptions(server);
	updateSystemOptions(server);
	server.channels?.forEach(updateSageChannel);
	// debug(`Updating Server: ${server.id} ... done.`);
	return server;
}