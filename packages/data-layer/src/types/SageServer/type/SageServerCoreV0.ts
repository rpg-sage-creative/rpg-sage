import type { OldSageChannel, OldSystemOptions } from "../../../updates/index.js";
import type { DialogOptionsOld } from "../../DialogOptions/DialogOptions.js";
import type { DiceOptionsOld } from "../../DiceOptions/DiceOptions.js";
import type { SageServerCoreV1 } from "./SageServerCoreV1.js";

export type SageServerCoreV0 = SageServerCoreV1 & OldSystemOptions & DiceOptionsOld & DialogOptionsOld & {
	channels: OldSageChannel[];
	id: string;
	/** @deprecated */
	logLevel?: unknown;
	/** @deprecated */
	nickName?: unknown;
};