import type { TMatcher } from "..";
import { isSnowflake, SnowflakeMatcher } from "../SnowflakeUtils";
import { StringMatcher } from "../StringUtils";
import { isUuid, UUID, UuidMatcher } from "../UuidUtils";
import { Core, HasCore } from "./HasCore";

//#region types

/** The second most basic Core used. */
export interface IdCore<ObjectType extends string = string, IdType extends string = UUID>
		extends Core<ObjectType> {
	/** The unique identifier for this object. */
	id: IdType;
}

//#endregion

//#region helpers

/** @todo move matcher to a static property instead of doing it this way. */
function createIdMatcher(id: string): TMatcher {
	if (isUuid(id)) return UuidMatcher.from(id);
	if (isSnowflake(id)) return SnowflakeMatcher.from(id);
	return StringMatcher.from(id);
}

//#endregion

/** Abstract Class with properties and methods related to the id. */
export abstract class HasIdCore<
		TypedCore extends IdCore<ObjectType, IdType>,
		ObjectType extends string = string,
		IdType extends string = UUID
		> extends HasCore<TypedCore, ObjectType> {

	/** The unique identifier for this object. */
	public get id(): IdType {
		return this.core.id;
	}

	/** The matcher used to compare id values between HasIdCore classes. */
	private _idMatcher?: TMatcher;

	/** Creates the idMatcher the first time needed. */
	protected get idMatcher(): TMatcher {
		return this._idMatcher ?? (this._idMatcher = createIdMatcher(this.core.id));
	}

	/** Returns true if the given id matches this object's id. */
	public equals(id: IdType): boolean;

	/** Returns true if the given string matches this object's id. */
	public equals(id: string): boolean;

	/** Returns true if the given UuidMatcher represents this object's id. */
	public equals(other: TMatcher): boolean

	public equals(other: IdType | string | TMatcher): boolean {
		return this.idMatcher.matches(other);
	}

}
