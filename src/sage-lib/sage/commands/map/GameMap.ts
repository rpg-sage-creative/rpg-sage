import type * as Discord from "discord.js";
import GameMapBase, { COL, LayerMapType, LayerType, ROW, TGameMapCore, TGameMapImage } from "./GameMapBase";

/** shuffles an image on a layer */
export type TShuffleDirection = "top" | "bottom" | "up" | "down";
function shuffleImage(images: TGameMapImage[], imageId: Discord.Snowflake, direction: TShuffleDirection): boolean {
	const image = images.find(img => img.id === imageId);
	if (!image) {
		return false;
	}
	const index = images.indexOf(image);
	switch(direction) {
		case "top":
			images = images.filter(t => t !== image).concat([image]);
			break;
		case "bottom":
			images = [image].concat(images.filter(t => t !== image));
			break;
		case "up":
			if (images.slice().pop() !== image) {
				const newIndex = index + 1;
				images = images.filter(t => t !== image);
				images.splice(newIndex, 0, image);
			}
			break;
		case "down":
			if (images[0] === image) {
				const newIndex = index - 1;
				images = images.filter(t => t !== image);
				images.splice(newIndex, 0, image);
			}
			break;
	}
	return index !== images.indexOf(image);
}

const UP = -1;
const DOWN = 1;
const LEFT = -1;
const RIGHT = 1;

export type TMoveDirection = "upleft" | "up" | "upright" | "left" | "right" | "downleft" | "down" | "downright";
function moveImage(image: TGameMapImage, direction: TMoveDirection): boolean {
	switch(direction) {
		case "upleft": return move(image, ROW, UP) && move(image, COL, LEFT);
		case "up": return move(image, ROW, UP);
		case "upright": return move(image, ROW, UP) && move(image, COL, RIGHT);
		case "left": return move(image, COL, LEFT);
		case "right": return move(image, COL, RIGHT);
		case "downleft": return move(image, ROW, DOWN) && move(image, COL, LEFT);
		case "down": return move(image, ROW, DOWN);
		case "downright": return move(image, ROW, DOWN) && move(image, COL, RIGHT);
		default: return false;
	}
}
function move(image: TGameMapImage, posIndex: 0 | 1, direction: -1 | 1): boolean {
	image.pos[posIndex] += direction;
	image.auras?.forEach(aura => aura.pos[posIndex] += direction);
	return true;
}

export default class GameMap extends GameMapBase {
	/** constructs a map for the given core and user */
	public constructor(core: TGameMapCore, public userId: Discord.Snowflake) {
		super(core);
	}

	//#region properties

	/** returns the user's currently active aura, or their active token's active aura if the active layer is Token */
	public get activeAura() {
		if (this.activeLayer === LayerType.Terrain) {
			const activeAuraId = this.activeLayerValues[LayerType.Aura];
			const userAuras = this.userAuras;
			return userAuras.find(aura => aura.id === activeAuraId) ?? userAuras[0];
		}
		const activeToken = this.activeToken;
		return activeToken?.auraId ? activeToken.auras.find(aura => aura.id === activeToken.auraId) : undefined;
	}

	/** returns the currently active image */
	public get activeImage() {
		const imageId = this.activeLayerValues[this.activeLayer];
		return this.core.tokens.find(image => image.id === imageId)
			?? this.core.terrain.find(image => image.id === imageId)
			?? this.core.auras.find(image => image.id === imageId)
			?? this.core.tokens.map(token => token.auras).flat().find(image => image.id === imageId);
	}
	/** sets the user's currently active layer and image */
	public set activeImage(activeImage: TGameMapImage | undefined) {
		const values = this.activeLayerValues;
		values[LayerMapType.Layer] = activeImage!.layer ?? LayerType.Token;
		values[activeImage!.layer] = activeImage!.id;
	}

	/** returns the user's currently active image's id */
	public get activeImageId() { return this.activeLayerValues[this.activeLayer]; }

	/** returns the user's currently active layer */
	public get activeLayer() { return this.activeLayerValues[LayerMapType.Layer]; }

	/** returns the user's active layer values */
	public get activeLayerValues() {
		return this.activeLayerMap[this.userId]
			?? (this.activeLayerMap[this.userId] = [LayerType.Token, undefined, undefined, undefined]);
	}

	/** returns the user's currently active terrain */
	public get activeTerrain() {
		const activeTerrainId = this.activeLayerValues[LayerType.Terrain];
		const userTerrain = this.userTerrain;
		return userTerrain.find(terrain => terrain.id === activeTerrainId) ?? userTerrain[0];
	}

	/** returns the user's currently active token */
	public get activeToken() {
		const activeTokenId = this.activeLayerValues[LayerType.Token];
		const userTokens = this.userTokens;
		return userTokens.find(token => token.id === activeTokenId) ?? userTokens[0];
	}

	/** returns the maps grid dimensions: [rows, cols] */
	public get grid() {
		return this.core.grid;
	}

	/** indicates the user is the owner of the map */
	public get isOwner() { return this.userId === this.ownerId; }

	/** retuns all the auras on the map this user can access */
	public get userAuras() { return this.isOwner ? this.auras : this.auras.filter(aura => aura.userId === this.userId); }

	/** returns all the terrain on the map this user can access */
	public get userTerrain() { return this.isOwner ? this.terrain : this.terrain.filter(terrain => terrain.userId === this.userId); }

	/** returns all the tokens on the map this user can access */
	public get userTokens() { return this.isOwner ? this.tokens : this.tokens.filter(token => token.userId === this.userId); }

	//#endregion

	//#region methods

	/** cycles to the next active aura */
	public cycleActiveAura() {
		if (this.activeLayer === LayerType.Terrain) {
			const auras = this.userAuras;
			if (auras.length < 2) {
				return false;
			}
			const prev = this.activeAura;
			const index = prev ? auras.indexOf(prev) : -1;
			const next = auras[index + 1] ?? auras[0];
			this.activeLayerValues[LayerType.Aura] = next.id;
		}else {
			const activeToken = this.activeToken;
			if (!activeToken) {
				return false;
			}
			const prev = this.activeAura;
			const index = prev ? activeToken.auras.indexOf(prev) : -1;
			const next = activeToken.auras[index + 1];
			activeToken.auraId = next?.id;
		}
		return true;
	}

	/** sets the active layer to Terrain and cycles to the next active terrain */
	public cycleActiveTerrain() {
		if (this.activeLayer !== LayerType.Terrain) {
			this.activeLayerValues[LayerMapType.Layer] = LayerType.Terrain;
			return true;
		}
		const terrain = this.userTerrain;
		if (terrain.length < 2) {
			return false;
		}
		const prev = this.activeTerrain;
		const index = terrain.indexOf(prev);
		const next = terrain[index + 1] ?? terrain[0];
		this.activeImage = next;
		return true;
	}

	/** sets the active layer to Token and cycles to the next active token */
	public cycleActiveToken() {
		if (this.activeLayer !== LayerType.Token) {
			this.activeLayerValues[LayerMapType.Layer] = LayerType.Token;
			return true;
		}
		const tokens = this.userTokens;
		if (tokens.length < 2) {
			return false;
		}
		const prev = this.activeToken;
		const index = tokens.indexOf(prev);
		const next = tokens[index + 1] ?? tokens[0];
		this.activeImage = next;
		return true;
	}

	public moveActiveToken(direction: TMoveDirection): boolean {
		const activeImage = this.activeImage;
		if (!activeImage) {
			return false;
		}
		return moveImage(activeImage, direction);
	}

	/** shuffles the user's active terrain */
	public shuffleActiveTerrain(direction: TShuffleDirection): boolean {
		const terrain = this.activeTerrain;
		if (!terrain) {
			return false;
		}
		return shuffleImage(this.terrain, terrain.id, direction);
	}

	/** shuffles the user's active token */
	public shuffleActiveToken(direction: TShuffleDirection): boolean {
		const token = this.activeToken;
		if (!token) {
			return false;
		}
		return shuffleImage(this.tokens, token.id, direction);
	}

	//#endregion

	//#region static

	/** loads the map for the given id for the given user */
	public static async forUser(messageId: Discord.Snowflake, userId: Discord.Snowflake, existingOnly = false) {
		const core = await GameMapBase.readCore(messageId);
		const map = core ? new GameMap(core, userId) : null;
		if (map) {
			return !existingOnly || map.isValidUser(userId) ? map : null;
		}
		return null;
	}

	//#endregion
}
