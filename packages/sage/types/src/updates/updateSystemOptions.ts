import { isDefined } from "@rsc-utils/type-utils";
import type { SystemOptions } from "../SageChannel.js";

export type OldSystemOptions = SystemOptions & {
	/** @deprecated */
	defaultGameType?: number;
};

export function updateSystemOptions(options: OldSystemOptions): void {
	if (isDefined(options.defaultGameType)) {
		options.gameSystemType = options.defaultGameType;
		delete options.defaultGameType;
	}
}