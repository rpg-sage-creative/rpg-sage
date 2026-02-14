import { parseSnowflake, parseUuid } from "@rsc-utils/core-utils";

/**
 * We are phasing out UUID.
 * If .id is UUID, move it to .uuid
 * If .did is Snowflake, move it to .id
 */
export function ensureIds(core: { id:string; did?:string; uuid?:string; }): void {
	const uuid = parseUuid(core.uuid) ?? parseUuid(core.id);
	const did = parseSnowflake(core.did) ?? parseSnowflake(core.id);
	if (uuid) core.uuid = uuid;
	if (did) core.did = did;
	core.id = did ?? uuid ?? core.id;
}