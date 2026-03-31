import { debug, generateSnowflake, generateUuid, parseSnowflake, parseUuid } from "@rsc-utils/core-utils";

type Core = { id:string; did?:string; uuid?:string; createdTs?:number; objectType?:string; };
type Options = { didTs?:number; uuidTs?:number; }

/**
 * We are phasing out UUID.
 * If .id is UUID, move it to .uuid
 * If .did is Snowflake, move it to .id
 */
export function ensureIds(core: Core, options?: Options): void {

	const snowflakeOpts = { ts:options?.didTs ?? core.createdTs };

	let did = parseSnowflake(core.did) ?? parseSnowflake(core.id);
	if (!did && options?.didTs) did = generateSnowflake(snowflakeOpts);
	if (did) core.did = did;
	else delete core.did;

	let uuid = parseUuid(core.uuid) ?? parseUuid(core.id);
	if (!uuid && options?.uuidTs) uuid = generateUuid({ ts:options.uuidTs });
	if (uuid) core.uuid = uuid;
	else delete core.uuid;

	let id = did ?? uuid ?? core.id;
	if (!id && core.objectType !== "Character") debug(`Missing ${core.objectType} Id: `, core);
	if (!id) id = generateSnowflake(snowflakeOpts);
	if (id) core.id = id;

	if (id === did) delete core.did;
}