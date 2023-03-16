import { HasCore } from ".";
import { isSnowflake } from "../DiscordUtils";
import SnowflakeMatcher from "../DiscordUtils/SnowflakeMatcher";
import { StringMatcher } from "../StringUtils";
import type { TMatcher, UUID } from "../types";
import { isValid, UuidMatcher } from "../UuidUtils";
import type { IdCore } from "./types";


function createIdMatcher(id: string): TMatcher {
	if (isValid(id)) return UuidMatcher.from(id);
	if (isSnowflake(id)) return SnowflakeMatcher.from(id);
	return StringMatcher.from(id);
}

export default abstract class HasIdCore<T extends IdCore<U, V>, U extends string = string, V extends string = UUID> extends HasCore<T, U> {

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
