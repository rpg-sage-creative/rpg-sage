import type { Snowflake } from "@rsc-utils/core-utils";
import type { GameMapLayerData } from "./GameMapLayer.js";
import type { GridArgs } from "./GridArgs.js";
import type { GridCoordinate } from "./GridCoordinate.js";
import type { LayerType } from "./LayerType.js";

/** represents the state of the controls of the map on a user basis */
type ActiveLayerMapValues = {
	/** currently selected aura */
	activeAura?: Snowflake;
	/** currently selected background image */
	activeBackground?: Snowflake;
	/** currently selected layer */
	activeLayer?: LayerType;
	/** currently selected terrain image */
	activeTerrain?: Snowflake;
	/** currently selected token image */
	activeToken?: Snowflake;
	/** previously selected layer (@todo remember why i did this and document it) */
	previousLayer?: LayerType;
};

/** the set of control state data keyed by userId/Snowflake */
export type ActiveLayerMap = {
	/** key represents a user id / snowflake */
	[key: string]: ActiveLayerMapValues;
};

/** the set of all layers for a map */
type GameMapLayerDataMap = {
	/** bottom most layer */
	background?: GameMapLayerData;
	/** the layer just above the background */
	terrain?: GameMapLayerData;
	/** the layer all auras are rendered on: above background/terrain, below token */
	aura?: GameMapLayerData;
	/** the top most layer, where all tokens are rendered */
	token?: GameMapLayerData;
};

/**
 * Core Game Map data.
 * Fetchable via url? (if i want to allow shareable maps)
 */
export type GameMapDataBase = {
	/** the data required to render a grid */
	grid?: GridArgs;

	/** the layers of the map */
	layers: GameMapLayerDataMap;

	/** name of the map */
	name: string;

	/** where tokens first appear: [col, row] */
	spawn?: GridCoordinate;

	userId?: string;
};

/**
 * Game Map "instance" data.
 * Not fetched from the url? (if i want to allow shareable maps)
 */
export type GameMapData = GameMapDataBase & {
	/** which layer each user is currently on */
	activeMap: ActiveLayerMap;

	/** unique identifier */
	id: Snowflake;

	/** the message this map is posted in */
	messageId: Snowflake;

	/** The url the map was fetched from ... also the url to fetch updated map data from? */
	url?: string;

	/** the owner of the map */
	userId: Snowflake;

	ver: "v2";
};

