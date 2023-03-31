import type { TMatcher } from "..";
import { isSnowflake, SnowflakeMatcher } from "../SnowflakeUtils";
import { StringMatcher } from "../StringUtils";
import { isValid, UUID, UuidMatcher } from "../UuidUtils";
import { Core, HasCore } from "./HasCore";

//#region types

/** The second most basic Core used. */
export interface IdCore<T extends string = string, U extends string = UUID> extends Core<T> {
	/** The unique identifier for this object. */
	id: U;
}

//#endregion

//#region helpers

function createIdMatcher(id: string): TMatcher {
	if (isValid(id)) return UuidMatcher.from(id);
	if (isSnowflake(id)) return SnowflakeMatcher.from(id);
	return StringMatcher.from(id);
}

//#endregion

export abstract class HasIdCore<T extends IdCore<U, V>, U extends string = string, V extends string = UUID> extends HasCore<T, U> {

	/** Must have a core. */
	public constructor(core: T) {
		super(core);
		this.cache.key = core.id;
	}

	/** The unique identifier for this object. */
	public get id(): V {
		return this.core.id;
	}

	private _idMatcher?: TMatcher;
	/** Used to cache the UuidMatcher used for .equals(). */
	protected get idMatcher(): TMatcher {
		return this._idMatcher ?? (this._idMatcher = createIdMatcher(this.core.id));
	}

	/** Returns true if the given UUID matches this object's id. */
	public equals(id: V): boolean;
	/** Returns true if the given string matches this object's id. */
	public equals(id: string): boolean;
	/** Returns true if the given UuidMatcher represents this object's id. */
	public equals(other: TMatcher): boolean
	public equals(other: V | string | TMatcher): boolean {
		return this.idMatcher.matches(other);
	}

}
