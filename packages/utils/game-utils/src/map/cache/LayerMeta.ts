import type { HasOffset } from "../types/HasOffset.js";
import type { LayerType } from "../types/LayerType.js";

export type LayerMeta = HasOffset & {
	type: LayerType;
};
