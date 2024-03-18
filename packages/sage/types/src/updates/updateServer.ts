import { debug } from "@rsc-utils/console-utils";
import { OldDialogOptions, updateDialogOptions } from "./updateDialogOptions.js";
import { OldDiceOptions, updateDiceOptions } from "./updateDiceOptions.js";
import { updateSageChannel, type OldSageChannel } from "./updateSageChannel.js";
import { OldSystemOptions, updateSystemOptions } from "./updateSystemOptions.js";

type ServerCore = OldSystemOptions & OldDiceOptions & OldDialogOptions & {
	channels: OldSageChannel[];
	id: string;
};

export function updateServer<T>(server: T): T;
export function updateServer<T extends ServerCore>(server: T): T {
	debug(`Updating Server: ${server.id} ...`);
	updateDialogOptions(server);
	updateDiceOptions(server);
	updateSystemOptions(server);
	server.channels?.forEach(updateSageChannel);
	debug(`Updating Server: ${server.id} ... done.`);
	return server;
}