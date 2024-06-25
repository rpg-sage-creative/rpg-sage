import type { Optional, OrUndefined, Snowflake } from "@rsc-utils/core-utils";
import type { CanBeChannelIdResolvable } from "../resolveChannelId.js";
import { resolveGuildId } from "../resolveGuildId.js";

/** @internal */
export function resolveChannelGuildId(resolvable: Optional<CanBeChannelIdResolvable>): OrUndefined<Snowflake> {
	if (resolvable && typeof(resolvable) !== "string" && "guildId" in resolvable) {
		return resolveGuildId(resolvable.guildId);
	}
	return undefined;
}