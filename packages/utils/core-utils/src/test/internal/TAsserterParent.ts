import type { TAsserterBase } from "./TAsserterBase.js";

/** @internal */
export type TAsserterParent = TAsserterBase & {
	assertMap: Map<string, boolean>;
	keySet: Set<string>;
	readMap: Map<string, boolean>;
}