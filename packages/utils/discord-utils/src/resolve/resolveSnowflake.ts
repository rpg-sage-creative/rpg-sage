import { isSnowflake, NIL_SNOWFLAKE, orNilSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";

type HasSnowflakeId = { id:Snowflake; };
/** @deprecated */
type HasSnowflakeDid = { did:Snowflake; };

export type SnowflakeResolvable = Snowflake | HasSnowflakeId | HasSnowflakeDid;

type CanHaveSnowflakeId = { id?:Snowflake; } | { id?:string; };
/** @deprecated */
type CanHaveSnowflakeDid = { did?:Snowflake; } | { did?:string; };

export type CanBeSnowflakeResolvable = string | CanHaveSnowflakeId | CanHaveSnowflakeDid;

/** Assumes a valid snowflake resolvable. */
export function resolveSnowflake(resolvable: SnowflakeResolvable): Snowflake;

/** Returns undefined if the value is not resolvable. */
export function resolveSnowflake(resolvable: Optional<CanBeSnowflakeResolvable>): Snowflake | undefined;

/** Returns NIL_SNOWFLAKE if the value is not resolvable. */
export function resolveSnowflake(resolvable: Optional<CanBeSnowflakeResolvable>, orNil: true): Snowflake | NIL_SNOWFLAKE;

/** Returns undefined if the value is not resolvable. */
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable>): Snowflake | undefined;

/** Returns NIL_SNOWFLAKE if the value is not resolvable. */
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable>, orNil: true): Snowflake | NIL_SNOWFLAKE;

export function resolveSnowflake(resolvable: Optional<CanBeSnowflakeResolvable>, orNil?: true): Snowflake | NIL_SNOWFLAKE | undefined {
	const out = orNil ? orNilSnowflake : (value: Optional<string>) => isSnowflake(value) ? value : undefined;
	if (resolvable) {
		if (typeof(resolvable) === "string") {
			return out(resolvable);
		}
		if ("did" in resolvable) {
			return out(resolvable.did);
		}
		if ("id" in resolvable) {
			return out(resolvable.id);
		}
	}
	return out(undefined);
}
