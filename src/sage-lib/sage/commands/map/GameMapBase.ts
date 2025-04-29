import { errorReturnFalse, errorReturnNull, getDataRoot, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { deleteFileSync, fileExistsSync, readJsonFile, readJsonFileSync, writeFile } from "@rsc-utils/io-utils";
import { RenderableGameMap } from "./RenderableGameMap.js";

//#region types

export const COL = 0;
export const ROW = 1;
export const X = 0;
export const Y = 1;

export enum LayerType { Terrain = 1, Aura = 2, Token = 3 }
export enum UserLayerType { Layer = 0, Terrain = 1, Aura = 2, Token = 3, PreviousLayer = 4 }

export type TGameMapImage = {
	/** the active aura for this image */
	auraId?: Snowflake;
	/** images that should go on the aura layer: above the terrain layer, below the token layer */
	auras: TGameMapAura[];
	/** unique identifier */
	id: Snowflake;
	/** the map layer this image belongs on */
	layer: LayerType;
	/** name of the token */
	name: string;
	/** position on the map: [col, row] */
	pos: [number, number];
	/** for token art that bleeds over their token/base */
	scale?: number;
	/** token size: [cols, rows] */
	size: [number, number];
	/** url to the image */
	url: string;
	/** the owner of the image */
	userId?: Snowflake;
};

export type TGameMapAura = TGameMapImage & {
	/** id of another token to anchor this one to */
	anchorId?: Snowflake;
	/** opacity of the token; primarily for auras */
	opacity?: number;
};

export type TGameMapTerrain = TGameMapImage;

export type TGameMapToken = TGameMapImage & {
	/** unique identifier to the GameCharacter */
	characterId?: string;
};

export type TActiveLayerMapValues = [
	/** Active Layer */
	LayerType,
	/** Active Terrain */
	Snowflake | undefined,
	/** Active Aura */
	Snowflake | undefined,
	/** Active Token */
	Snowflake | undefined,
	/** Previous Layer */
	LayerType
];

export type TActiveLayerMap = {
	[key: string]: TActiveLayerMapValues;
};

export type TGameMapCore = {
	/** which layer each user is currently on */
	activeMap: TActiveLayerMap;
	/** images that should go on the aura layer: above the terrain layer, below the token layer */
	auras: TGameMapAura[];
	/** image clip rectangle: [xOffset, yOffset, width, height] */
	clip?: [number, number, number, number];
	/** grid dimensions: [cols, rows, color] */
	grid: [number, number, string | undefined];
	/** unique identifier */
	id: Snowflake;
	/** the message this map is posted in */
	messageId: Snowflake;
	/** name of the map */
	name: string;
	/** where tokens first appear: [col, row] */
	spawn?: [number, number];
	/** images that should go on the terrain layer: the bottom layer */
	terrain: TGameMapTerrain[];
	/** images that should go on the token layer: the top layer */
	tokens: TGameMapToken[];
	/** the owner of the map */
	userId: Snowflake;
	/** url to the image */
	url: string;
};

//#endregion

/** returns path to the json file */
function getMapFilePath(messageId: Snowflake): string {
	return `${getDataRoot("sage")}/maps/${messageId}.json`;
}

export abstract class GameMapBase {
	/** constructs a map for the given core */
	public constructor(protected core: TGameMapCore) { }

	//#region properties

	/** returns a map of the active layers with all users */
	public get activeLayerMap() { return this.core.activeMap ?? (this.core.activeMap = {}); }

	/** returns all the auras on the map (not anchored to another image) */
	public get auras() { return this.core.auras; }

	/** returns the id of the map */
	public get id() { return this.core.id; }

	/** returns the id of the message this map is posted in */
	public get messageId() { return this.core.messageId; }
	/** sets the id of the message this map is posted in */
	public set messageId(messageId) { this.core.messageId = messageId; }

	/** returns the name of the map */
	public get name() { return this.core.name; }

	/** Snowflake of the map's owner */
	public get ownerId() { return this.core.userId; }

	/** returns the map's spawn location, or 1,1 as the default */
	public get spawn() { return this.core.spawn ?? [1, 1]; }

	/** returns all the terrain on the map */
	public get terrain() { return this.core.terrain; }

	/** returns all the tokens on the map */
	public get tokens() { return this.core.tokens; }

	//#endregion

	//#region methods

	/** returns true if the user owns the map or has an image */
	public isValidUser(userId: Snowflake): boolean {
		return this.ownerId === userId
			|| this.terrain.find(terrain => terrain.userId === userId)
			|| this.auras.find(aura => aura.userId === userId)
			|| this.tokens.find(token => token.userId === userId)
			? true : false;
	}

	/** returns a RenderableGameMap */
	public toRenderable(): RenderableGameMap { return new RenderableGameMap(this.core); }

	/** saves the maps core to file */
	public save() {
		return writeFile(getMapFilePath(this.messageId), this.core, true)
			.catch(errorReturnFalse);
	}

	//#endregion

	//#region static

	/** returns true if a map for the given id exists */
	public static exists(messageId: Optional<string>): messageId is Snowflake {
		return messageId ? fileExistsSync(getMapFilePath(messageId as Snowflake)) : false;
	}

	public static delete(messageId: Snowflake): boolean {
		const path = getMapFilePath(messageId);
		return deleteFileSync(path);
	}

	/** returns true if a map for the given id has the given name */
	public static matches(messageId: Snowflake, name: string): boolean {
		const core = this.exists(messageId) ? readJsonFileSync<TGameMapCore>(getMapFilePath(messageId)) : null;
		return core?.name === name;
	}

	public static readCore(messageId: Snowflake) {
		return readJsonFile<TGameMapCore>(getMapFilePath(messageId)).catch(errorReturnNull);
	}

	public static toRenderable(mapCore: TGameMapCore): RenderableGameMap {
		return new RenderableGameMap(mapCore);
	}

	//#endregion
}
