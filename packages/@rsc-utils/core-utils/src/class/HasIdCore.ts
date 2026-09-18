import { getIdMatcher, type Snowflake, type UUID } from "@rsc-utils/id-utils";
import type { Matcher } from "@rsc-utils/type-utils";
import { HasCore, type Core } from "./HasCore.js";

//#region types

/** Represents an object that has an ID. */
type HasId<IdType extends string = string> = {
	/** The unique identifier for this object. */
	id: IdType;

	/** @deprecated transitional holder until all objects are converted to id as Snowflake */
	did?: Snowflake;
	/** @deprecated transitional holder until all objects are converted to id as Snowflake */
	uuid?: UUID;
};

/** The second most basic Core used. */
export type IdCore<
	ObjectType extends string = string,
	IdType extends string = string
>
= Core<ObjectType>
	& HasId<IdType>;

//#endregion

/** Abstract Class with properties and methods related to the id. */
export abstract class HasIdCore<
			TypedCore extends IdCore<ObjectType>,
			ObjectType extends string = string,
			IdType extends string = string
		>
		extends HasCore<TypedCore, ObjectType> {

	/** The unique identifier for this object. */
	public get id(): IdType { return this.core.id as IdType; }

	/** Used to cache the SnowflakeMatcher or UuidMatcher used for .equals(). */
	private _idMatcher?: Matcher;

	/** Used to cache the SnowflakeMatcher or UuidMatcher used for .equals(). */
	protected get idMatcher(): Matcher {
		return this._idMatcher ?? (this._idMatcher = getIdMatcher(this.core.id));
	}

	/** @deprecated Used to cache the SnowflakeMatcher used for .equals(). */
	private _didMatcher?: Matcher;

	/** @deprecated Used to cache the SnowflakeMatcher used for .equals(). */
	protected get didMatcher(): Matcher {
		return this._didMatcher ?? (this._didMatcher = getIdMatcher(this.core.did));
	}

	/** @deprecated Used to cache the UuidMatcher used for .equals(). */
	private _uuidMatcher?: Matcher;

	/** @deprecated Used to cache the UuidMatcher used for .equals(). */
	protected get uuidMatcher(): Matcher {
		return this._uuidMatcher ?? (this._uuidMatcher = getIdMatcher(this.core.uuid));
	}

	/** Returns true if the given object represents this object, it's core, or it's id. */
	public equals(other: string | IdType | Matcher | HasIdCore<any> | null | undefined): boolean {
		if (!other) {
			return false;
		}

		if (other instanceof HasIdCore) {
			//#region @deprecated return logic

			if (this.is(other as HasIdCore<any, any>)) return true;
			if (this.idMatcher.matchesAny(other.idMatcher, other.didMatcher, other.uuidMatcher)) return true;
			if (this.didMatcher.matchesAny(other.idMatcher, other.didMatcher)) return true;
			if (this.uuidMatcher.matchesAny(other.idMatcher, other.uuidMatcher)) return true;

			return false;

			//#endregion

			//#region wanted return logic

			// return this.is(other as HasIdCore<any, any>)
			// 	|| this.idMatcher.matches(other.idMatcher);

			//#endregion
		}

		//#region @deprecated return logic

		if (typeof(other) === "string") {
			return getIdMatcher(other).matchesAny(this.idMatcher, this.didMatcher, this.uuidMatcher);
		}

		return other.matchesAny(this.idMatcher, this.didMatcher, this.uuidMatcher);

		//#endregion

		//#region wanted return logic

		// return this.idMatcher.matches(other);

		//#endregion
	}

}
