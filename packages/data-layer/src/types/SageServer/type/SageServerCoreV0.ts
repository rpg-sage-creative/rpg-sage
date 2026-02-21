import type { OldDialogOptions, OldDiceOptions, OldSageChannel, OldSystemOptions } from "../../../updates/index.js";
import type { SageServerCoreV1 } from "./SageServerCoreV1.js";

export type SageServerCoreV0 = SageServerCoreV1 & OldSystemOptions & OldDiceOptions & OldDialogOptions & {
	channels: OldSageChannel[];
	id: string;
};