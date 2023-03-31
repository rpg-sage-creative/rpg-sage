import type { Snowflake } from "discord.js";
import type { Optional } from "..";
import { NIL_SNOWFLAKE, orNilSnowflake } from "../SnowflakeUtils";

type HasSnowflakeId = { id:Snowflake; };
type HasSnowflakeDid = { did:Snowflake; };
export type SnowflakeResolvable = Snowflake | HasSnowflakeId | HasSnowflakeDid;

type CanHaveSnowflakeId = { id?:Snowflake; };
type CanHaveSnowflakeDid = { did?:Snowflake; };
type CanBeSnowflakeResolvable = CanHaveSnowflakeId | CanHaveSnowflakeDid;

export function resolveSnowflake(resolvable: SnowflakeResolvable): Snowflake;
export function resolveSnowflake(resolvable: Optional<CanBeSnowflakeResolvable>): Snowflake | undefined;
export function resolveSnowflake(resolvable: Optional<CanBeSnowflakeResolvable>, orNil: true): Snowflake | NIL_SNOWFLAKE;
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable>): Snowflake | undefined;
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable>, orNil: true): Snowflake | NIL_SNOWFLAKE;
export function resolveSnowflake(resolvable: Optional<SnowflakeResolvable | CanBeSnowflakeResolvable>, orNil?: true): Snowflake | NIL_SNOWFLAKE | undefined {
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