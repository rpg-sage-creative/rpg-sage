import type { SageChannelOld } from "../../SageChannel.js";
import type { DialogOptionsOld } from "../../DialogOptions/DialogOptions.js";
import type { DiceOptionsOld } from "../../DiceOptions/DiceOptions.js";
import type { GameSystemOptionsOld } from "../../GameSystemOptions.js";
import type { SageServerCoreV1 } from "./SageServerCoreV1.js";

export type SageServerCoreV0 = Omit<SageServerCoreV1, "channels"> & DiceOptionsOld & DialogOptionsOld & GameSystemOptionsOld & {
	channels: SageChannelOld[];
	/** @deprecated */
	games?: unknown;
	id: string;
	/** @deprecated */
	logLevel?: unknown;
	/** @deprecated */
	nickName?: unknown;
};