import type { HexColorString } from "@rsc-utils/core-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import type { NumberPair, NumberQuartet } from "../../types/NumberArray.js";

export enum LayerTypeV1 { Terrain = 1, Aura = 2, Token = 3 }
// enum UserLayerType { Layer = 0, Terrain = 1, Aura = 2, Token = 3, PreviousLayer = 4 }

type GameGridData = [
	/** cols */
	number,
	/** rows */
	number,
	/** strokeStyle */
	HexColorString | undefined,
	/** grid type */
	"square" | "vhex" | "hex" | undefined
];

export type TGameMapImage = {
	/** the active aura for this image */
	auraId?: Snowflake;
	/** images that should go on the aura layer: above the terrain layer, below the token layer */
	auras: TGameMapAura[];
	/** unique identifier */
	id: Snowflake;
	/** the map layer this image belongs on */
	layer: LayerTypeV1;
	/** name of the token */
	name: string;
	/** position on the map: [col, row] */
	pos: NumberPair;
	/** for token art that bleeds over their token/base */
	scale?: number;
	/** token size: [cols, rows] */
	size: NumberPair;
	/** url to the image */
	url: string;
	/** the owner of the image */
	userId?: Snowflake;
};

type TGameMapAura = TGameMapImage & {
	/** id of another token to anchor this one to */
	anchorId?: Snowflake;
	/** opacity of the token; primarily for auras */
	opacity?: number;
};

type TGameMapToken = TGameMapImage & {
	/** unique identifier to the GameCharacter */
	characterId?: string;
};

type TActiveLayerMapValues = [
	/** Active Layer */
	LayerTypeV1,
	/** Active Terrain */
	Snowflake | undefined,
	/** Active Aura */
	Snowflake | undefined,
	/** Active Token */
	Snowflake | undefined,
	/** Previous Layer */
	LayerTypeV1
];

type TActiveLayerMap = {
	[key: string]: TActiveLayerMapValues;
};

/** @deprecated */
export type GameMapCoreV1 = {
	/** which layer each user is currently on */
	activeMap: TActiveLayerMap;
	/** images that should go on the aura layer: above the terrain layer, below the token layer */
	auras: TGameMapAura[];
	/** image clip rectangle: [xOffset, yOffset, width, height] */
	clip?: NumberQuartet;
	/** grid dimensions: [cols, rows, color] */
	grid: GameGridData;
	/** unique identifier */
	id: Snowflake;
	/** the message this map is posted in */
	messageId: Snowflake;
	/** name of the map */
	name: string;
	/** where tokens first appear: [col, row] */
	spawn?: NumberPair;
	/** images that should go on the terrain layer: the bottom layer */
	terrain: TGameMapImage[];
	/** images that should go on the token layer: the top layer */
	tokens: TGameMapToken[];
	/** the owner of the map */
	userId: Snowflake;
	/** url to the image */
	url: string;
};
