import { parseSnowflake, parseUuid, generateSnowflake, generateUuid } from "@rsc-utils/core-utils";

type Core = { id:string; did?:string; uuid?:string; };
type Options = { didTs?:number; uuidTs?:number; }

/**
 * We are phasing out UUID.
 * If .id is UUID, move it to .uuid
 * If .did is Snowflake, move it to .id
 */
export function ensureIds(core: Core, options?: Options): void {

	let did = parseSnowflake(core.did) ?? parseSnowflake(core.id);
	did ??= generateSnowflake({ ts:options?.didTs });
	core.did = did;

	let uuid = parseUuid(core.uuid) ?? parseUuid(core.id);
	if (!uuid && options?.uuidTs) uuid = generateUuid({ ts:options.uuidTs });
	if (uuid) core.uuid = uuid;

	core.id = did ?? uuid ?? core.id;

}