import type { OrUndefined } from "../../sage-utils";
import type { TUuidMatcher } from "../../sage-utils/UuidUtils";
import type { TEntity } from "../model";
import { getByType } from "./repoMap";

/** Finds the entity matching the given objectType and uuidMatcher. */
export function findByTypeAndId<T extends string, U extends TEntity<T> = TEntity<T>>(objectType: T, uuidMatcher: TUuidMatcher): OrUndefined<U> {
	return getByType<U>(objectType).find(base => base.equals(uuidMatcher));
}
