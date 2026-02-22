import { type EnsureContext } from "../../../validation/index.js";
import { type SageUserCoreV0, type SageUserCoreV1 } from "../../index.js";

export function ensureSageGameCoreV1(core: SageUserCoreV0, _context?: EnsureContext): SageUserCoreV1 {
	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

	core.ver = 1;

	return core as SageUserCoreV1;
}