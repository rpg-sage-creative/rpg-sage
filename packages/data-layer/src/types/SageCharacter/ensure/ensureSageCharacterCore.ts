import { randomSnowflake } from "@rsc-utils/core-utils";
import { coreNeedsUpdate, type EnsureOptions } from "../../../validation/index.js";
import { ensureSageCharacterCoreV1, type SageCharacterCore, type SageCharacterCoreAny, type SageCharacterCoreV0 } from "../index.js";

export function ensureSageCharacterCore(core: SageCharacterCoreAny, { context, ver = 1 }: EnsureOptions): SageCharacterCore {
	if (!core.id) core.id = randomSnowflake();
	if (coreNeedsUpdate(core, ver)) {
		core = ensureSageCharacterCoreV1(core as SageCharacterCoreV0, context);
	}
	return core as SageCharacterCore;
}