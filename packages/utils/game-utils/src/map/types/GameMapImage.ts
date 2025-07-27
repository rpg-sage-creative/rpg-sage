import type { Snowflake } from "@rsc-utils/core-utils";
import type { HasClip } from "./HasClip.js";
import type { HasOffset } from "./HasOffset.js";
import type { HasOpacity } from "./HasOpacity.js";
import type { HasScale } from "./HasScale.js";
import type { HasSize } from "./HasSize.js";
import type { HasUrl } from "./HasUrl.js";

/** Represents all the information about a map's image. */
export type GameMapImageBase = Partial<HasClip> & HasOffset & HasOpacity & HasScale & HasSize & HasUrl & {
	/** unique identifier for the image */
	id: Snowflake;

	/** name of the image */
	name: string;

	/** id of the image's owner */
	userId?: Snowflake;
};

export type GameMapImage = GameMapImageBase & {
	/** NonAuraOnly: all auras anchored to the image */
	auras?: GameMapImage[];
};

export type GameMapAura = GameMapImageBase & {
	/** AuraOnly: the id of the image this aura is anchored to */
	anchorId?: Snowflake;

	/** AuraOnly: true if the aura is visible */
	isActive?: boolean;
};
