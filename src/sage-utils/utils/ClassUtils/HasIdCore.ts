import type { Matcher } from "@rsc-utils/type-utils";
import { HasCore, type Core } from "./HasCore";
import { getIdMatcher } from "./getIdMatcher";

//#region types

/** Represents an object that has an ID. */
type HasId<IdType extends string = string> = {
	/** The unique identifier for this object. */
	id: IdType;
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

	/** Used to cache the UuidMatcher used for .equals(). */
	private _idMatcher?: Matcher;

	/** Used to cache the UuidMatcher used for .equals(). */
	protected get idMatcher(): Matcher {
		return this._idMatcher ?? (this._idMatcher = getIdMatcher(this.core.id));
	}

	/** Returns true if the given id matches this object's id. */
	public equals(id: IdType): boolean;
	/** Returns true if the given string matches this object's id. */
	public equals(id: string): boolean;
	/** Returns true if the given Matcher represents this object's id. */
	public equals(other: Matcher): boolean;
	public equals(other: string | Matcher): boolean {
		return this.idMatcher.matches(other);
	}

}
