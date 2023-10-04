import { UuidMatcher } from "../UuidUtils";
import { TUuidMatcher, UUID } from "../types";
import { Core, HasCore } from "./HasCore";

//#region types

/** Represents an object that has an ID. */
type HasId<IdType extends string = string> = {
	/** The unique identifier for this object. */
	id: IdType;
}

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
