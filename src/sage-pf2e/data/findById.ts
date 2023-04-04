import type { OrUndefined } from "../../sage-utils";
import { UUID, UuidMatcher } from "../../sage-utils/UuidUtils";
import type { Base } from "../model/base/Base";
import { findByTypeAndId } from "./findByTypeAndId";
import { getObjectTypes } from "./repoMap";

/** Finds the object for the given UUID. */
export function findById<T extends Base>(id: OrUndefined<UUID>): OrUndefined<T> {
	const uuidMatcher = id ? UuidMatcher.from(id) : null;
	if (uuidMatcher?.isValid) {
		for (const objectType of getObjectTypes()) {
			const found = findByTypeAndId(objectType, uuidMatcher);
			if (found) {
				return <T>found;
			}
		}
	}
	console.info(`findById(${uuidMatcher?.value ?? id}) not found!`);
	return undefined;
}
