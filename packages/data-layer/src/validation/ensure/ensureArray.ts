import type { Snowflake } from "@rsc-utils/core-utils";
import type { HasVer } from "../../types/index.js";

export type EnsureContext = {
	characterId?: string;
	userId?: Snowflake;
};

export type EnsureOptions = {
	context?: EnsureContext;
	ver?: number;
};

type EnsureArrayHandler<OldValue, NewValue> = (object: OldValue | NewValue, options: EnsureOptions) => NewValue;

type EnsureArrayArgs<Core, Key, Handler> = {
	core: Core;
	key: Key;
	handler: Handler;
	context?: EnsureContext;
};

type EnsureVersionedArrayArgs<Core, Key, Handler> = {
	core: Core;
	key: Key;
	handler: Handler;
	ver: number;
	context?: EnsureContext;
};

type Args<Core, Key, Handler> = EnsureArrayArgs<Core, Key, Handler> | EnsureVersionedArrayArgs<Core, Key, Handler>;

export function ensureArray<
			Core extends HasVer & Partial<Record<Key, (OldValue | NewValue)[]>>,
			Key extends Exclude<keyof Core, "ver">,
			OldValue,
			NewValue
		>(args: EnsureArrayArgs<Core, Key, EnsureArrayHandler<OldValue, NewValue>>): void;

export function ensureArray<
			Core extends HasVer & Partial<Record<Key, (OldValue | NewValue)[]>>,
			Key extends Exclude<keyof Core, "ver">,
			OldValue extends HasVer,
			NewValue extends HasVer
		>(args: EnsureVersionedArrayArgs<Core, Key, EnsureArrayHandler<OldValue, NewValue>>): void;

export function ensureArray<
			Core extends HasVer & Partial<Record<Key, (OldValue | NewValue)[]>>,
			Key extends Exclude<keyof Core, "ver">,
			OldValue extends HasVer,
			NewValue extends HasVer
		>(args: Args<Core, Key, EnsureArrayHandler<OldValue, NewValue>>): void {

	const { core, key, handler, context } = args;
	if ("ver" in args) {
		core[key] = core[key]?.map(o => {
			if ((o.ver ?? 0) < args.ver) {
				return handler(o, { context });
			}
			return o;
		})
		.filter(o => o !== undefined) as any;
	}else {
		core[key] = core[key]
			?.map(o => handler(o, { context }))
			.filter(o => o !== undefined) as any;
	}
}