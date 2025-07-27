import type { Awaitable, Snowflake } from "@rsc-utils/core-utils";
import type { GameMapImage } from "./GameMapImage.js";
import type { HasOffset } from "./HasOffset.js";
import type { LayerType } from "./LayerType.js";

/** Represents map layer data. */
export type GameMapLayerData = HasOffset & {
	id: Snowflake;
	images: GameMapImage[];
	type: LayerType;
};

/** Represents an object that returns map layer data. */
export interface GameMapLayer {
	id: Snowflake;
	getImages(): Awaitable<GameMapImage[]>;
	getOffset(): Awaitable<HasOffset>;
	type: LayerType;
}
