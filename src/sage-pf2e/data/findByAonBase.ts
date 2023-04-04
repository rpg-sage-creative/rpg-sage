import type { OrUndefined } from "../../sage-utils";
import type { AonBase } from "../model/base/AonBase";
import type { Base } from "../model/base/Base";
import type { HasSource } from "../model/base/HasSource";
import { findByType } from "./find";
import { getObjectTypes } from "./repoMap";

/** Finds the entity that matches the given aonBase. */
export function findByAonBase<T extends Base | HasSource>(aonBase: AonBase): OrUndefined<T> {
	const objectTypes = getObjectTypes();
	for (const objectType of objectTypes) {
		const found = findByType(objectType, base => aonBase.matchesBase(base));
		if (found) {
			return found as T;
		}
	}
	return undefined;
}