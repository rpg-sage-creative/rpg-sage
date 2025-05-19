import type { Optional, OrUndefined, Snowflake } from "@rsc-utils/core-utils";
import type { Role } from "discord.js";
import { resolveSnowflake, type CanBeSnowflakeResolvable, type SnowflakeResolvable } from "./resolveSnowflake.js";

export type RoleIdResolvable = SnowflakeResolvable | Role;

export type CanBeRoleIdResolvable = RoleIdResolvable | CanBeSnowflakeResolvable; //NOSONAR

/** Resolves to Snowflake. */
export function resolveRoleId(resolvable: RoleIdResolvable): Snowflake;

/** Resolves to Snowflake or undefined. */
export function resolveRoleId(resolvable: Optional<CanBeRoleIdResolvable>): OrUndefined<Snowflake>;

export function resolveRoleId(resolvable: Optional<CanBeRoleIdResolvable>): OrUndefined<Snowflake> {
	if (resolvable) {
		return resolveSnowflake(resolvable);
	}
	return undefined;
}