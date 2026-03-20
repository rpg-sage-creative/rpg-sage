import type { Snowflake } from "@rsc-utils/core-utils";
import { deleteEmptyArray } from "../utils/deleteEmptyArray.js";

export type EnsureContext = {
	characterId?: Snowflake;
	characterType?: "gm" | "npc" | "pc";
	gameId?: Snowflake;
	serverId?: Snowflake;
	snowflakeDate?: number;
	userId?: Snowflake;
};

type Args<Core, Key, OldValue, NewValue> = {
	context?: EnsureContext;
	core: Core;
	handler: (object: OldValue, context?: EnsureContext) => NewValue | undefined;
	key: Key;
	optional?: "optional";
	typeGuard?: never;
} | {
	context?: EnsureContext;
	core: Core;
	handler?: never;
	key: Key;
	optional?: "optional";
	typeGuard: (object: unknown) => object is NewValue;
};

export function ensureArray<
			Core extends Partial<Record<Key, OldValue[]>>,
			Key extends keyof Core,
			OldValue,
			NewValue
		>({ core, key, handler, context, optional, typeGuard }: Args<Core, Key, OldValue, NewValue>): void {

	// remove non-array
	if (core[key] && !Array.isArray(core[key])) {
		delete core[key];
	}

	if (handler) {
		// map and filter array
		core[key] = core[key]
			?.map(o => handler(o, context))
			.filter(o => o !== undefined && o !== null)
			?? [] as any;
	}

	if (typeGuard) {
		// filter array
		core[key] = core[key]?.filter(typeGuard) ?? [] as any;
	}

	// remove optional empty array
	if (optional === "optional") {
		deleteEmptyArray({ core, key });
	}
}
