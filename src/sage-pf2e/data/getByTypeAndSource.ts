import { StringMatcher } from "../../sage-utils/StringUtils";
import type { HasSource } from "../model/base/HasSource";
import { getByType } from "./repoMap";

/** Returns all objects for the given objectType with a matching Source. */
export function getByTypeAndSource<T extends HasSource>(objectType: string, source: string): T[] {
	const items = getByType<HasSource>(objectType);
	const stringMatcher = StringMatcher.from(source);
	return items.filter((item: HasSource) => item.source?.matches(stringMatcher)) as T[];
}
