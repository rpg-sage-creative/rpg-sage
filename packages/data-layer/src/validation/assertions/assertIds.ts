import { isNonNilSnowflake, isNonNilUuid, type IdCore } from "@rsc-utils/core-utils";
import { tagFailure } from "../utils/index.js";

type Info<Core extends IdCore> = {
	core: Core;
	id?: "snowflake" | "uuid";
	objectType: string;
};
export function assertIds<Core extends IdCore>(info: Info<Core>): boolean {
	const { core, id, objectType } = info;

	if (id === "snowflake") {
		if (!isNonNilSnowflake(core.id)) return tagFailure`${objectType}: invalid snowflake id (${core.id})`;

	}else if (id === "uuid") {
		if (!isNonNilUuid(core.id)) return tagFailure`${objectType}: invalid uuid id (${core.id})`;

	}else {
		if (!(isNonNilSnowflake(core.id) || isNonNilUuid(core.id))) return tagFailure`${objectType}: invalid id (${core.id})`;
	}

	if ("did" in core) {
		if (!isNonNilSnowflake(core.did)) return tagFailure`${objectType}: invalid did (${core.did})`;
	}
	if ("uuid" in core) {
		if (!isNonNilUuid(core.uuid)) return tagFailure`${objectType}: invalid uuid (${core.uuid})`;
	}

	// if ((core.did || core.uuid) && core.id !== core.did && core.id !== core.uuid) return errorReturnFalse(tagLiterals`mismatched ids: id=${core.id}; did=${core.did}; uuid=${core.uuid}`);

	return true;
}