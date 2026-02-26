import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageChannelOld } from "../../../index.js";
import type { DialogOptionsOld } from "../../DialogOptions.js";
import type { DiceOptionsOld } from "../../DiceOptions/DiceOptions.js";
import type { GameSystemOptionsOld } from "../../GameSystemOptions.js";
import type { SageGameCoreV1 } from "./SageGameCoreV1.js";

export type SageGameCoreV0 = Omit<SageGameCoreV1, "channels"> & DiceOptionsOld & DialogOptionsOld & GameSystemOptionsOld & {
	channels: SageChannelOld[];
	/** @deprecated */
	gameMasters?: { did:Snowflake; }[];
	/** @deprecated */
	players?: { did:Snowflake; }[];
	/** @deprecated */
	type?: number;
}