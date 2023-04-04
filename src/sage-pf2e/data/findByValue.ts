import type { Optional, OrUndefined } from "../../sage-utils";
import { StringMatcher } from "../../sage-utils/StringUtils";
import { UuidMatcher } from "../../sage-utils/UuidUtils";
import type { TEntity } from "../model";
import type { Base } from "../model/base/Base";
import type { Source } from "../model/base/Source";
import type { Creature } from "../model/bestiary/Creature";
import { findByTypeAndId } from "./findByTypeAndId";
import { getByType } from "./repoMap";

/** Finds a Creature that has an id or name that matches the given value. */
export function findByValue(objectType: "Creature", value: string): OrUndefined<Creature>;

/** Finds a Source that has an id or name that matches the given value. */
export function findByValue(objectType: "Source", value: string): Source;

/** Finds an entity of the given objectType that has an id or name that matches the given value. */
export function findByValue<T extends string>(objectType: T, value: Optional<string>): OrUndefined<TEntity<T>>;


export function findByValue<T extends Base<any>>(objectType: string, value: Optional<string>): OrUndefined<T> {
	if (!value) {
		return undefined;
	}

	const uuidMatcher = UuidMatcher.from(value);
	if (uuidMatcher.isValid) {
		return findByTypeAndId(objectType, uuidMatcher);
	}

	const stringMatcher = StringMatcher.from(value);
	if (stringMatcher.isBlank) {
		return undefined;
	}

	return getByType<T>(objectType).find(base => base.matches(stringMatcher));
}
