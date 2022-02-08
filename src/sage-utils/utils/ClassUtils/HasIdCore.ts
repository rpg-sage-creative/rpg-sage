import { HasCore } from ".";
import type { TUuidMatcher, UUID } from "../types";
import { UuidMatcher } from "../UuidUtils";
import type { IdCore } from "./types";

export default abstract class HasIdCore<T extends IdCore<U>, U extends string = string> extends HasCore<T, U> {

	/** Must have a core. */
	public constructor(core: T) {
		super(core);
		this.cache.key = core.id;
	}

	/** The unique identifier for this object. */
	public get id(): UUID {
		return this.core.id;
	}

	private _idMatcher?: UuidMatcher;
	/** Used to cache the UuidMatcher used for .equals(). */
	protected get idMatcher(): UuidMatcher {
		return this._idMatcher ?? (this._idMatcher = UuidMatcher.from(this.core.id));
	}

	/** Returns true if the given UUID matches this object's id. */
	public equals(id: UUID): boolean;
	/** Returns true if the given string matches this object's id. */
	public equals(id: string): boolean;
	/** Returns true if the given UuidMatcher represents this object's id. */
	public equals(other: TUuidMatcher): boolean
	public equals(other: UUID | TUuidMatcher): boolean {
		return this.idMatcher.matches(other);
	}

}
