import { isDefined } from "@rsc-utils/core-utils";
import type { SystemOptions } from "../SageChannel.js";

export type OldSystemOptions = SystemOptions & {
	/** @deprecated */
	defaultGameType?: number;
	/** @deprecated */
	gameType?: number;
};

export function updateSystemOptions(options: OldSystemOptions): void {
	if (isDefined(options.defaultGameType)) {
		options.gameSystemType = options.defaultGameType;
		delete options.defaultGameType;
	}
	if (isDefined(options.gameType)) {
		options.gameSystemType = options.gameType;
		delete options.gameType;
	}
}