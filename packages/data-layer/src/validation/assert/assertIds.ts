import { isNonNilSnowflake, isNonNilUuid, type IdCore } from "@rsc-utils/core-utils";
import { tagFailure } from "../index.js";

type Info<Core extends IdCore> = {
	core: Core;
	id?: "snowflake" | "uuid";
	objectType: string;
};
export function assertIds<Core extends IdCore>(info: Info<Core>): boolean {
	const { core, id, objectType } = info;

	const idIsSnowflake = isNonNilSnowflake(core.id);
	const idIsUuid = isNonNilUuid(core.id);

	if (id === "snowflake") {
		if (!idIsSnowflake) return tagFailure`${objectType}: invalid snowflake id (${core.id})`;

	}else if (id === "uuid") {
		if (!idIsUuid) return tagFailure`${objectType}: invalid uuid id (${core.id})`;

	}else {
		if (!idIsSnowflake && !idIsUuid) return tagFailure`${objectType}: invalid id (${core.id})`;
	}

	if ("did" in core) {
		const didIsValid = isNonNilSnowflake(core.did);
		if (!didIsValid) return tagFailure`${objectType}: invalid did (${core.did})`;
		if (idIsSnowflake && core.id !== core.did) return tagFailure`${objectType}: mismatched id (${core.id}) and did (${core.did})`;
	}

	if ("uuid" in core) {
		const uuidIsValid = isNonNilUuid(core.uuid);
		if (!uuidIsValid) return tagFailure`${objectType}: invalid uuid (${core.uuid})`;
		if (idIsUuid && core.id !== core.uuid) return tagFailure`${objectType}: mismatched id (${core.id}) and uuid (${core.uuid})`;
	}

	return true;
}