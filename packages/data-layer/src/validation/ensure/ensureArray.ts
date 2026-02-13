import type { HasVer } from "../../types/index.js";

export function ensureArray<
			Core extends HasVer & Partial<Record<Key, (OldValue | NewValue)[]>>,
			Key extends Exclude<keyof Core, "ver">,
			OldValue extends HasVer,
			NewValue extends HasVer,
			Handler extends Function
		>({ core, key, handler, ver }: { core:Core; key:Key; handler:Handler; ver:number; }): void {
	core[key] = core[key]?.map(o => (o.ver ?? 0) < ver ? o as NewValue : handler(o as OldValue) as NewValue) as any;
}