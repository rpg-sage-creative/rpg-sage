// import { debug } from "@rsc-utils/core-utils";
import type { SageChannel } from "../SageChannel/SageChannel.js";
import { updateChannelOptions, type OldChannelOptions } from "./updateChannelOptions.js";
import { updateDialogOptions, type OldDialogOptions } from "./updateDialogOptions.js";
import { updateDiceOptions, type OldDiceOptions } from "./updateDiceOptions.js";
import { updateSystemOptions, type OldSystemOptions } from "./updateSystemOptions.js";

export type OldSageChannel = SageChannel
& OldChannelOptions & OldDialogOptions & OldDiceOptions & OldSystemOptions
& {
	/** @deprecated */
	did?: string;

	/** @deprecated */
	nickName?: string;

	/** @deprecated */
	sendCommandTo?: string;
	/** @deprecated */
	sendSearchTo?: string;

};

/** @todo fix this cast */
export function updateSageChannel(channel: any): void;
export function updateSageChannel(channel: OldSageChannel): void {
	// debug(`\tUpdating Channel: ${channel.did??channel.id} ...`);
	channel.id = channel.did ?? channel.id;
	channel.did = channel.id;
	// delete channel.did;

	updateChannelOptions(channel);
	updateDialogOptions(channel);
	updateDiceOptions(channel);
	updateSystemOptions(channel);

	delete channel.nickName;
	delete channel.sendCommandTo;
	delete channel.sendSearchTo;
	// debug(`\tUpdating Channel: ${channel.id} ... done.`);
}
