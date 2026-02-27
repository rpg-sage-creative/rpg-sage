import type { Snowflake } from "@rsc-utils/core-utils";
import { deleteEmptyArray } from "../utils/deleteEmptyArray.js";

export type EnsureContext = {
	characterId?: Snowflake;
	gameId?: Snowflake;
	serverId?: Snowflake;
	userId?: Snowflake;
};

type Args<Core, Key, OldValue, NewValue> = {
	context?: EnsureContext;
	core: Core;
	key: Key;
	handler: (object: OldValue | NewValue, context?: EnsureContext) => NewValue;
	optional?: "optional";
};

export function ensureArray<
			Core extends Partial<Record<Key, (OldValue | NewValue)[]>>,
			Key extends Exclude<keyof Core, "ver">,
			OldValue,
			NewValue
		>({ core, key, handler, context, optional }: Args<Core, Key, OldValue, NewValue>): void {

	// remove non-array
	if (core[key] && !Array.isArray(core[key])) {
		delete core[key];
	}

	// map and filter array
	core[key] = core[key]
		?.map(o => handler(o, context))
		.filter(o => o !== undefined && o !== null)
		?? [] as any;

	// remove optional empty array
	if (optional === "optional") {
		deleteEmptyArray({ core, key });
	}
}
