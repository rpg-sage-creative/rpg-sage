import type { Snowflake } from "discord.js";
import type { Optional } from "../..";
import { NilSnowflake } from "./consts";

type HasSnowflakeId = { id:Snowflake; };
type HasSnowflakeDid = { did:Snowflake; };
export type SnowflakeResolvable = Snowflake | HasSnowflakeId | HasSnowflakeDid;

type CanHaveSnowflakeId = { id?:Snowflake; };
type CanHaveSnowflakeDid = { did?:Snowflake; };
type CanBeSnowflakeResolvable = CanHaveSnowflakeId | CanHaveSnowflakeDid;

/** Returns true if the value is a series of at least 16 numeric digits. */
export function isSnowflake(value: Optional<Snowflake>): value is Snowflake {
	const match = value?.match(/^\d{16,}$/) ?? null;
	return match !== null;
}

/**
 * Returns true if the value is a series of at least 16 0s.
 * This accounts for possibly old data that incorrectly assumed a static length of a Snowflake and had a different length for NilSnowflake.
 */
export function isNilSnowflake(value: Optional<Snowflake>): value is typeof NilSnowflake {
	const match = value?.match(/^0{16,}$/) ?? null;
	return match !== null;
}

export function isNonNilSnowflake(value: Optional<Snowflake>): value is Snowflake {
	return isSnowflake(value) && !isNilSnowflake(value);
}

/** Returns the value if it is a valid Snowflake, otherwise it returns NilSnowflake. */
export function orNilSnowflake(value: Optional<Snowflake>): Snowflake {
	return isSnowflake(value) && !isNilSnowflake(value) ? value : NilSnowflake;
}

export function resolveSnowflake(resolvable: SnowflakeResolvable): Snowflake;
export function resolveSnowflake(resolvable: Optional<CanBeSnowflakeResolvable>): Snowflake | undefined;
export function resolveSnowflake(resolvable: Optional<CanBeSnowflakeResolvable>, orNil: true): Snowflake | typeof NilSnowflake;
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable>): Snowflake | undefined;
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable>, orNil: true): Snowflake | typeof NilSnowflake;
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable | CanBeSnowflakeResolvable>, orNil?: true): Snowflake | typeof NilSnowflake | undefined {
	const out = orNil ? orNilSnowflake : (value: Optional<Snowflake>) => value as Snowflake;
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
